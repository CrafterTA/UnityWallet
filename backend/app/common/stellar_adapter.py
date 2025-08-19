"""Stellar network adapter with dry-run capability."""

from stellar_sdk import Server, Keypair, TransactionBuilder, Account, Asset
from stellar_sdk.exceptions import BaseHorizonError as StellarError
from tenacity import retry, stop_after_attempt, wait_exponential
from typing import Dict, Any, Optional
from .config import settings
from .logging import get_logger, log_stellar_operation
import base64

logger = get_logger("stellar_adapter")


class StellarAdapter:
    """Stellar network adapter with retry logic and dry-run support."""
    
    def __init__(self):
        self.server = Server(settings.STELLAR_HORIZON_URL)
        self.network_passphrase = (
            "Test SDF Network ; September 2015" if settings.STELLAR_NETWORK == "testnet"
            else "Public Global Stellar Network ; September 2015"
        )
    
    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=4, max=10))
    def _submit_transaction(self, xdr: str) -> Dict[str, Any]:
        """Submit transaction with retry logic."""
        try:
            response = self.server.submit_transaction(xdr)
            return {
                "success": True,
                "tx_hash": response["hash"],
                "result_code": response.get("result_xdr")
            }
        except StellarError as e:
            logger.error(f"Stellar transaction failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "result_code": getattr(e, 'result_code', None)
            }
    
    def send_payment(
        self,
        source_account: str,
        destination: str, 
        asset_code: str,
        amount: str,
        memo: Optional[str] = None,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send payment with dry-run capability."""
        try:
            # For demo, use a mock source keypair (in production, use secure key management)
            source_keypair = Keypair.random()  # Mock keypair for demo
            
            # Load account
            account = self.server.load_account(source_account)
            
            # Determine asset
            if asset_code == "XLM":
                asset = Asset.native()
            else:
                # For demo, assume custom assets are issued by a specific issuer
                asset = Asset(asset_code, source_account)  # Mock issuer
            
            # Build transaction
            builder = TransactionBuilder(
                source_account=account,
                network_passphrase=self.network_passphrase,
                base_fee=100
            )
            
            builder.add_payment_op(
                destination=destination,
                amount=amount,
                asset=asset
            )
            
            if memo:
                builder.add_text_memo(memo)
            
            transaction = builder.set_timeout(30).build()
            transaction.sign(source_keypair)
            
            xdr = transaction.to_xdr()
            
            # Log the operation
            log_stellar_operation(
                logger,
                "payment",
                xdr,
                correlation_id=correlation_id,
                extra={
                    "source": source_account,
                    "destination": destination,
                    "asset_code": asset_code,
                    "amount": amount,
                    "memo": memo
                }
            )
            
            if settings.STELLAR_DRY_RUN:
                # Return XDR without submitting
                return {
                    "success": True,
                    "xdr": xdr,
                    "dry_run": True,
                    "tx_hash": None
                }
            else:
                # Submit to network
                result = self._submit_transaction(xdr)
                result["xdr"] = xdr
                return result
                
        except Exception as e:
            logger.error(f"Payment operation failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "xdr": None
            }
    
    def create_trustline(
        self,
        source_account: str,
        asset_code: str,
        asset_issuer: str,
        limit: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create trustline for custom asset."""
        try:
            source_keypair = Keypair.random()  # Mock keypair
            account = self.server.load_account(source_account)
            
            asset = Asset(asset_code, asset_issuer)
            
            builder = TransactionBuilder(
                source_account=account,
                network_passphrase=self.network_passphrase,
                base_fee=100
            )
            
            builder.add_change_trust_op(asset=asset, limit=limit)
            
            transaction = builder.set_timeout(30).build()
            transaction.sign(source_keypair)
            
            xdr = transaction.to_xdr()
            
            log_stellar_operation(
                logger,
                "create_trustline",
                xdr,
                extra={
                    "source": source_account,
                    "asset_code": asset_code,
                    "asset_issuer": asset_issuer,
                    "limit": limit
                }
            )
            
            if settings.STELLAR_DRY_RUN:
                return {
                    "success": True,
                    "xdr": xdr,
                    "dry_run": True,
                    "tx_hash": None
                }
            else:
                result = self._submit_transaction(xdr)
                result["xdr"] = xdr
                return result
                
        except Exception as e:
            logger.error(f"Trustline creation failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def path_payment(
        self,
        source_account: str,
        destination: str,
        send_asset: str,
        send_amount: str,
        dest_asset: str,
        dest_amount: str
    ) -> Dict[str, Any]:
        """Mock path payment for demo."""
        try:
            # For demo, just log the path payment preview
            log_stellar_operation(
                logger,
                "path_payment_preview",
                "mock_xdr_for_path_payment",
                extra={
                    "source": source_account,
                    "destination": destination,
                    "send_asset": send_asset,
                    "send_amount": send_amount,
                    "dest_asset": dest_asset,
                    "dest_amount": dest_amount
                }
            )
            
            return {
                "success": True,
                "xdr": "mock_path_payment_xdr",
                "dry_run": True,
                "path": [send_asset, dest_asset],  # Mock direct path
                "tx_hash": None
            }
            
        except Exception as e:
            logger.error(f"Path payment failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Global adapter instance
stellar_adapter = StellarAdapter()


def get_stellar_adapter() -> StellarAdapter:
    """Get Stellar adapter instance."""
    return stellar_adapter