import base64
from decimal import Decimal, InvalidOperation
from fastapi import HTTPException
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solders.message import Message
from solders.instruction import Instruction, AccountMeta
from spl.token.instructions import transfer, TransferParams
from spl.token.constants import TOKEN_PROGRAM_ID
from core.config import client, tx_opts
from services.solana import (
    valid_secret, valid_pub, resolve_token, balances_of, 
    get_recent_blockhash, submit_transaction
)
from models.schemas import TokenRef

def _convert_ui_to_lamports(amount: str, token_ref: TokenRef) -> str:
    """Convert UI amount to lamports/smallest unit"""
    try:
        ui_amount = Decimal(amount)
        if token_ref.mint == "native":
            # SOL: 1 SOL = 1,000,000,000 lamports
            return str(int(ui_amount * Decimal("1000000000")))
        else:
            # SPL tokens: use decimals from token_ref
            decimals = token_ref.decimals or 6  # Default to 6 decimals
            multiplier = Decimal(10) ** decimals
            return str(int(ui_amount * multiplier))
    except (InvalidOperation, ValueError):
        return amount  # Return original if conversion fails

def estimate_payment_fee() -> int:
    """Estimate fee for a token transfer transaction"""
    return 5000  # Base fee for Solana transaction

def execute_payment(secret: str, destination: str, token_ref: TokenRef, amount: str):
    """Execute token payment (backend signing)"""
    if not valid_secret(secret):
        raise HTTPException(400, "Invalid secret")
    if not valid_pub(destination):
        raise HTTPException(400, "Invalid destination")
    
    # Convert UI amount to lamports/smallest unit
    converted_amount = _convert_ui_to_lamports(amount, token_ref)
    
    kp = Keypair.from_base58_string(secret)
    
    # Handle SOL transfers (native token)
    if token_ref.mint == "native" or token_ref.mint == "So11111111111111111111111111111111111111112":
        return execute_sol_transfer(secret, destination, int(converted_amount))
    
    # Handle SPL token transfers
    mint = resolve_token(token_ref.mint)
    
    # Get source token account
    source_token_accounts = client.get_token_accounts_by_owner(
        kp.pubkey(),
        {"mint": mint}
    )
    
    if not source_token_accounts.value:
        raise HTTPException(400, "Source token account not found")
    
    source_token_account = source_token_accounts.value[0].pubkey
    
    # Get destination token account
    dest_pubkey = Pubkey.from_string(destination)
    dest_token_accounts = client.get_token_accounts_by_owner(
        dest_pubkey,
        {"mint": mint}
    )
    
    if not dest_token_accounts.value:
        raise HTTPException(400, "Destination token account not found")
    
    dest_token_account = dest_token_accounts.value[0].pubkey
    
    # Create transfer instruction
    transfer_ix = transfer(
        TransferParams(
            program_id=TOKEN_PROGRAM_ID,
            source=source_token_account,
            dest=dest_token_account,
            owner=kp.pubkey(),
            amount=int(converted_amount)
        )
    )
    
    # Build transaction
    recent_blockhash = get_recent_blockhash()
    message = Message.new_with_blockhash(
        instructions=[transfer_ix],
        payer=kp.pubkey(),
        blockhash=recent_blockhash
    )
    
    # Create unsigned transaction
    transaction = Transaction.new_unsigned(message)
    transaction.sign([kp], recent_blockhash)
    
    # Submit transaction
    result = submit_transaction(transaction)
    
    return {
        "signature": result["signature"],
        "transaction": result["transaction"],
        "balances": balances_of(str(kp.pubkey())),
        "explorer_link": result.get("explorer_link"),
        "solscan_link": result.get("solscan_link")
    }

def build_payment_transaction(source_public: str, destination: str, token_ref: TokenRef, amount: str) -> str:
    """Build unsigned payment transaction for frontend signing"""
    if not valid_pub(source_public):
        raise HTTPException(400, "Invalid source_public")
    if not valid_pub(destination):
        raise HTTPException(400, "Invalid destination")
    
    # Convert UI amount to lamports/smallest unit
    converted_amount = _convert_ui_to_lamports(amount, token_ref)
    
    source_pubkey = Pubkey.from_string(source_public)
    dest_pubkey = Pubkey.from_string(destination)
    
    # Handle SOL transfers (native token)
    if token_ref.mint == "native" or token_ref.mint == "So11111111111111111111111111111111111111112":
        # Create transfer instruction for SOL manually
        system_program_id = Pubkey.from_string("11111111111111111111111111111111")
        
        # System program transfer instruction data: [2, 0, 0, 0] + 8-byte lamports
        instruction_data = bytes([2, 0, 0, 0]) + int(converted_amount).to_bytes(8, 'little')
        
        transfer_ix = Instruction(
            program_id=system_program_id,
            accounts=[
                AccountMeta(pubkey=source_pubkey, is_signer=True, is_writable=True),
                AccountMeta(pubkey=dest_pubkey, is_signer=False, is_writable=True),
            ],
            data=instruction_data
        )
        
        # Build unsigned transaction
        recent_blockhash = get_recent_blockhash()
        message = Message.new_with_blockhash(
            instructions=[transfer_ix],
            payer=source_pubkey,
            blockhash=recent_blockhash
        )
        
        # Create unsigned transaction
        transaction = Transaction.new_unsigned(message)
        
        # Return base64 encoded transaction
        return base64.b64encode(bytes(transaction)).decode('utf-8')
    
    # Handle SPL token transfers
    mint = resolve_token(token_ref.mint)
    
    # Get source token account
    source_token_accounts = client.get_token_accounts_by_owner(
        source_pubkey,
        {"mint": mint}
    )
    
    if not source_token_accounts.value:
        raise HTTPException(400, "Source token account not found")
    
    source_token_account = source_token_accounts.value[0].pubkey
    
    # Get destination token account
    dest_token_accounts = client.get_token_accounts_by_owner(
        dest_pubkey,
        {"mint": mint}
    )
    
    if not dest_token_accounts.value:
        raise HTTPException(400, "Destination token account not found")
    
    dest_token_account = dest_token_accounts.value[0].pubkey
    
    # Create transfer instruction
    transfer_ix = transfer(
        TransferParams(
            program_id=TOKEN_PROGRAM_ID,
            source=source_token_account,
            dest=dest_token_account,
            owner=source_pubkey,
            amount=int(converted_amount)
        )
    )
    
    # Build unsigned transaction
    recent_blockhash = get_recent_blockhash()
    message = Message.new_with_blockhash(
        instructions=[transfer_ix],
        payer=source_pubkey,
        blockhash=recent_blockhash
    )
    
    # Convert MessageV0 to Message for Transaction constructor
    transaction = Transaction([], Message.from_bytes(bytes(message)), [])
    
    # Return base64 encoded transaction
    return base64.b64encode(bytes(transaction)).decode('utf-8')

def execute_sol_transfer(secret: str, destination: str, amount: int):
    """Execute SOL transfer (native token)"""
    if not valid_secret(secret):
        raise HTTPException(400, "Invalid secret")
    if not valid_pub(destination):
        raise HTTPException(400, "Invalid destination")
    
    kp = Keypair.from_base58_string(secret)
    dest_pubkey = Pubkey.from_string(destination)
    
    # Create transfer instruction for SOL manually
    system_program_id = Pubkey.from_string("11111111111111111111111111111111")
    
    # System program transfer instruction data: [2, 0, 0, 0] + 8-byte lamports
    instruction_data = bytes([2, 0, 0, 0]) + amount.to_bytes(8, 'little')
    
    transfer_ix = Instruction(
        program_id=system_program_id,
        accounts=[
            AccountMeta(pubkey=kp.pubkey(), is_signer=True, is_writable=True),
            AccountMeta(pubkey=dest_pubkey, is_signer=False, is_writable=True),
        ],
        data=instruction_data
    )
    
    # Check if destination account exists
    from services.solana import account_exists
    
    instructions = [transfer_ix]
    
    # If destination account doesn't exist, we need to send enough SOL for rent exemption
    if not account_exists(destination):
        # Add rent exemption amount (890880 lamports) to the transfer
        total_amount = amount + 890880
        transfer_ix = Instruction(
            program_id=system_program_id,
            accounts=[
                AccountMeta(pubkey=kp.pubkey(), is_signer=True, is_writable=True),
                AccountMeta(pubkey=dest_pubkey, is_signer=False, is_writable=True),
            ],
            data=bytes([2, 0, 0, 0]) + total_amount.to_bytes(8, 'little')
        )
        instructions = [transfer_ix]
    
    # Build transaction
    recent_blockhash = get_recent_blockhash()
    message = Message.new_with_blockhash(
        instructions=instructions,
        payer=kp.pubkey(),
        blockhash=recent_blockhash
    )
    
    # Create unsigned transaction
    transaction = Transaction.new_unsigned(message)
    transaction.sign([kp], recent_blockhash)
    
    # Submit transaction
    result = submit_transaction(transaction)
    
    return {
        "signature": result["signature"],
        "transaction": result["transaction"],
        "balances": balances_of(str(kp.pubkey())),
        "explorer_link": result.get("explorer_link"),
        "solscan_link": result.get("solscan_link")
    }
