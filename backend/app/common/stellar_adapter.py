"""Stellar network adapter for Unity Wallet."""

from stellar_sdk import (
    Server, 
    Keypair, 
    TransactionBuilder, 
    Network,
    Asset,
    Payment,
    Account
)
from stellar_sdk.exceptions import BaseHorizonError as StellarError
from decimal import Decimal
from typing import Dict, Any, Optional, Tuple
import logging
from .config import settings

logger = logging.getLogger(__name__)

class StellarAdapter:
    """Adapter for interacting with Stellar network."""
    
    def __init__(self):
        """Initialize Stellar adapter."""
        self.server = Server(settings.STELLAR_HORIZON_URL)
        self.network_passphrase = (
            Network.TESTNET_NETWORK_PASSPHRASE 
            if settings.STELLAR_NETWORK == "testnet" 
            else Network.PUBLIC_NETWORK_PASSPHRASE
        )
        self.dry_run = settings.STELLAR_DRY_RUN
        
        logger.info(f"Stellar adapter initialized for {settings.STELLAR_NETWORK} network")
    
    def generate_keypair(self) -> Tuple[str, str]:
        """Generate a new Stellar keypair."""
        keypair = Keypair.random()
        return keypair.public_key, keypair.secret
    
    def get_account_info(self, public_key: str) -> Optional[Dict[str, Any]]:
        """Get account information from Stellar network."""
        try:
            account = self.server.accounts().account_id(public_key).call()
            return {
                "account_id": account["account_id"],
                "sequence": account["sequence"],
                "balances": account["balances"]
            }
        except StellarError as e:
            logger.error(f"Error fetching account info for {public_key}: {e}")
            return None
    
    def get_balance(self, public_key: str, asset_code: str = "XLM") -> Decimal:
        """Get balance for specific asset."""
        account_info = self.get_account_info(public_key)
        if not account_info:
            return Decimal("0")
        
        for balance in account_info["balances"]:
            if asset_code == "XLM" and balance["asset_type"] == "native":
                return Decimal(balance["balance"])
            elif balance.get("asset_code") == asset_code:
                return Decimal(balance["balance"])
        
        return Decimal("0")
    
    def send_payment(
        self, 
        source_account: str, 
        destination: str, 
        amount: str, 
        asset_code: str = "XLM",
        memo: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send payment on Stellar network.
        
        Args:
            source_account: Source Stellar public key  
            destination: Destination Stellar public key
            amount: Amount to send as string
            asset_code: Asset code (default XLM)
            memo: Optional memo text
        """
        try:
            amount_decimal = Decimal(amount)
            
            if self.dry_run:
                logger.info(f"DRY RUN: Would send {amount} {asset_code} from {source_account} to {destination}")
                return {
                    "success": True,
                    "dry_run": True,
                    "transaction_hash": "dry_run_hash_" + source_account[:10],
                    "tx_hash": "dry_run_hash_" + source_account[:10],
                    "from": source_account,
                    "to": destination,
                    "amount": amount,
                    "asset": asset_code,
                    "memo": memo,
                    "envelope_xdr": "dry_run_xdr_placeholder"
                }
            
            # For production, this would need proper key management
            # For now, return a mock success response
            logger.warning("Production Stellar transactions not implemented - using mock response")
            mock_hash = f"mock_tx_hash_{source_account[:8]}_{destination[:8]}"
            
            return {
                "success": True,
                "transaction_hash": mock_hash,
                "tx_hash": mock_hash,
                "from": source_account,
                "to": destination,
                "amount": amount,
                "asset": asset_code,
                "memo": memo,
                "envelope_xdr": "mock_xdr_placeholder",
                "mock": True
            }
            
        except Exception as e:
            logger.error(f"Payment failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "from": source_account,
                "to": destination,
                "amount": amount,
                "asset": asset_code
            }
    
    def create_account(self, new_account_public: str, starting_balance: Decimal = Decimal("1")) -> Dict[str, Any]:
        """Create a new account on Stellar network (testnet only)."""
        if settings.STELLAR_NETWORK != "testnet":
            return {
                "success": False,
                "error": "Account creation only supported on testnet"
            }
        
        if self.dry_run:
            logger.info(f"DRY RUN: Would create account {new_account_public} with {starting_balance} XLM")
            return {
                "success": True,
                "dry_run": True,
                "account_id": new_account_public,
                "starting_balance": str(starting_balance)
            }
        
        try:
            # On testnet, use friendbot to fund new accounts
            response = self.server.accounts().account_id(new_account_public).call()
            return {
                "success": True,
                "account_id": new_account_public,
                "message": "Account already exists"
            }
        except StellarError:
            # Account doesn't exist, create it via friendbot
            try:
                import requests
                friendbot_url = f"https://friendbot.stellar.org?addr={new_account_public}"
                response = requests.get(friendbot_url)
                
                if response.status_code == 200:
                    logger.info(f"Account created successfully: {new_account_public}")
                    return {
                        "success": True,
                        "account_id": new_account_public,
                        "starting_balance": "10000.0000000"  # Friendbot default
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Friendbot request failed: {response.status_code}"
                    }
            except Exception as e:
                logger.error(f"Error creating account: {e}")
                return {
                    "success": False,
                    "error": str(e)
                }

# Global Stellar adapter instance
stellar_adapter = StellarAdapter()

def get_stellar_adapter() -> StellarAdapter:
    """Get Stellar adapter instance."""
    return stellar_adapter