import requests
from typing import Optional
from fastapi import HTTPException
from stellar_sdk import Keypair, Asset
from chain.core.config import (
    server, FRIENDBOT,
    SYP_CODE, ISS_PUB,
    USDC_CODE, USDC_ISSUER,
)

def valid_secret(s: str) -> bool:
    try:
        Keypair.from_secret(s)
        return True
    except Exception:
        return False

def valid_pub(p: str) -> bool:
    try:
        Keypair.from_public_key(p)
        return True
    except Exception:
        return False

def _canon(s: Optional[str]) -> str:
    return (s or "").strip()

def _is_native(code: Optional[str], issuer: Optional[str]) -> bool:
    c = (_canon(code)).upper()
    i = (_canon(issuer)).lower()
    return c in ("XLM", "NATIVE") or i == "native"

def resolve_asset(code: str, issuer: Optional[str] = None) -> Asset:
    """
    Resolver 'thân thiện':
      - XLM/native => Asset.native()
      - code == SYP_CODE => issuer = ISS_PUB (lấy từ .env)
      - code == USDC_CODE => issuer = USDC_ISSUER (lấy từ .env)
      - mã khác: yêu cầu có issuer (nếu thiếu -> 400)
    """
    c = (_canon(code)).upper()
    i = _canon(issuer)

    # Native
    if _is_native(c, i):
        return Asset.native()

    # SYP (ENV)
    if c == (_canon(SYP_CODE).upper() or "SYP"):
        if not ISS_PUB:
            raise HTTPException(500, "Missing SYP_ISSUER_PUBLIC in ENV.")
        return Asset(SYP_CODE, ISS_PUB)

    # USDC (ENV)
    if c == (_canon(USDC_CODE).upper() or "USDC"):
        if not USDC_ISSUER:
            raise HTTPException(400, "Missing USDC_ISSUER in ENV. Provide issuer or set USDC_ISSUER.")
        return Asset(USDC_CODE, USDC_ISSUER)

    # Các mã khác cần issuer
    if not i:
        raise HTTPException(400, f"Missing issuer for non-native asset '{c}'.")
    if i.lower() == "native":
        raise HTTPException(400, "Use code 'XLM' (or omit issuer) for native asset.")
    return Asset(c, i)

# Back-compat alias
def asset_from_ref(code: str, issuer: Optional[str] = None) -> Asset:
    return resolve_asset(code, issuer)

def friendbot_fund(pub: str):
    r = requests.get(FRIENDBOT, params={"addr": pub}, timeout=20)
    if r.status_code != 200:
        raise HTTPException(400, f"Friendbot failed: {r.text}")

def account_exists(pub: str) -> bool:
    try:
        server.accounts().account_id(pub).call()
        return True
    except Exception:
        return False

def balances_of(pub: str):
    acc = server.accounts().account_id(pub).call()
    out = {}
    for b in acc.get("balances", []):
        if b["asset_type"] == "native":
            out["XLM"] = b["balance"]
        else:
            out[f'{b["asset_code"]}:{b["asset_issuer"]}'] = b["balance"]
    return out

def base_fee() -> int:
    return server.fetch_base_fee()

def tx_lookup(hash: str):
    return server.transactions().transaction(hash).call()

def asset_to_str(a: Asset) -> str:
    return "XLM" if a.is_native() else f"{a.code}:{a.issuer}"

def get_account_transactions(pub: str, limit: int = 10, cursor: Optional[str] = None):
    """Get transaction history for an account from Stellar Horizon"""
    try:
        # Get transactions for this account
        transactions_call = server.transactions().for_account(pub).limit(limit)
        if cursor:
            transactions_call = transactions_call.cursor(cursor)
        
        transactions_response = transactions_call.order(desc=True).call()
        
        processed_transactions = []
        for tx in transactions_response.get('_embedded', {}).get('records', []):
            # Get operations for this transaction to understand what happened
            operations = server.operations().for_transaction(tx['hash']).call()
            
            for op in operations.get('_embedded', {}).get('records', []):
                if op['type'] == 'payment':
                    # Determine direction
                    direction = 'received' if op['to'] == pub else 'sent'
                    
                    processed_transactions.append({
                        'id': f"{tx['hash']}_{op['id']}",
                        'hash': tx['hash'],
                        'tx_type': 'PAYMENT',
                        'direction': direction,
                        'asset_code': op['asset_code'] if op['asset_type'] != 'native' else 'XLM',
                        'asset_issuer': op.get('asset_issuer'),
                        'amount': op['amount'],
                        'source': op['from'],
                        'destination': op['to'],
                        'memo': tx.get('memo'),
                        'status': 'success' if tx['successful'] else 'failed',
                        'created_at': tx['created_at'],
                        'ledger': tx['ledger'],
                        'fee_charged': tx['fee_charged']
                    })
                elif op['type'] == 'path_payment_strict_send' or op['type'] == 'path_payment_strict_receive':
                    # This is a swap/DEX trade
                    direction = 'received' if op['to'] == pub else 'sent'
                    
                    processed_transactions.append({
                        'id': f"{tx['hash']}_{op['id']}",
                        'hash': tx['hash'],
                        'tx_type': 'SWAP',
                        'direction': direction,
                        'asset_code': op['destination_asset_code'] if op['destination_asset_type'] != 'native' else 'XLM',
                        'asset_issuer': op.get('destination_asset_issuer'),
                        'amount': op['destination_amount'],
                        'source': op['from'],
                        'destination': op['to'],
                        'source_asset_code': op['source_asset_code'] if op['source_asset_type'] != 'native' else 'XLM',
                        'source_amount': op['source_amount'],
                        'memo': tx.get('memo'),
                        'status': 'success' if tx['successful'] else 'failed',
                        'created_at': tx['created_at'],
                        'ledger': tx['ledger'],
                        'fee_charged': tx['fee_charged']
                    })
        
        return {
            'transactions': processed_transactions,
            'next_cursor': transactions_response.get('_links', {}).get('next', {}).get('href', '').split('cursor=')[-1] if transactions_response.get('_links', {}).get('next') else None
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch transactions: {str(e)}")

def get_account_payments(pub: str, limit: int = 10, cursor: Optional[str] = None):
    """Get payment history for an account (simpler version focusing on payments only)"""
    try:
        payments_call = server.payments().for_account(pub).limit(limit)
        if cursor:
            payments_call = payments_call.cursor(cursor)
        
        payments_response = payments_call.order(desc=True).call()
        
        processed_payments = []
        for payment in payments_response.get('_embedded', {}).get('records', []):
            direction = 'received' if payment['to'] == pub else 'sent'
            
            processed_payments.append({
                'id': payment['id'],
                'hash': payment['transaction_hash'],
                'tx_type': 'PAYMENT',
                'direction': direction,
                'asset_code': payment['asset_code'] if payment['asset_type'] != 'native' else 'XLM',
                'asset_issuer': payment.get('asset_issuer'),
                'amount': payment['amount'],
                'source': payment['from'],
                'destination': payment['to'],
                'status': 'success',  # Horizon only returns successful operations
                'created_at': payment['created_at']
            })
        
        return {
            'transactions': processed_payments,
            'next_cursor': payments_response.get('_links', {}).get('next', {}).get('href', '').split('cursor=')[-1] if payments_response.get('_links', {}).get('next') else None
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch payments: {str(e)}")
