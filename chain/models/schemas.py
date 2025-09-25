from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict, Any, Union, Annotated

# ==== Wallet ====
class CreateWalletReq(BaseModel):
    fund: bool = True
    use_mnemonic: bool = True
    words: int = 12
    account_index: int = 0
    passphrase: str = ""

class ImportSecretReq(BaseModel):
    secret: str  # Base58 encoded private key
    fund: bool = True

class ImportMnemonicReq(BaseModel):
    mnemonic: str
    passphrase: str = ""
    account_index: int = 0
    fund: bool = True

# ==== Token ====
class TokenRef(BaseModel):
    mint: str  # Solana mint address
    symbol: Optional[str] = None
    decimals: Optional[int] = None


# ==== Send ====
class SendEstimateReq(BaseModel):
    source: TokenRef
    amount: str = Field(..., description="Amount in UI units (e.g., '1.0' for 1 SOL)")
    destination: str

class SendExecReq(SendEstimateReq):
    secret: str

# ==== Swap ====
class QuoteSendReq(BaseModel):
    mode: Literal["send"] = "send"
    source_token: TokenRef
    source_amount: str = Field(..., description="Source amount in UI units (e.g., '1.0' for 1 SOL)")
    dest_token: TokenRef
    source_account: Optional[str] = None
    slippage_bps: int = 200

class QuoteReceiveReq(BaseModel):
    mode: Literal["receive"] = "receive"
    source_token: TokenRef
    dest_token: TokenRef
    dest_amount: str = Field(..., description="Destination amount in UI units (e.g., '100.0' for 100 USDT)")
    source_account: Optional[str] = None
    slippage_bps: int = 200

QuoteBody = Annotated[
    Union[QuoteSendReq, QuoteReceiveReq],
    Field(discriminator="mode")
]

class ExecuteSwapReq(BaseModel):
    mode: Literal["send", "receive"]
    secret: str
    destination: Optional[str] = None
    source_token: TokenRef
    dest_token: TokenRef
    source_amount: Optional[str] = Field(None, description="Source amount in UI units (e.g., '1.0' for 1 SOL)")
    dest_min: Optional[str] = Field(None, description="Minimum destination amount in UI units")
    dest_amount: Optional[str] = Field(None, description="Destination amount in UI units (e.g., '100.0' for 100 USDT)")
    source_max: Optional[str] = Field(None, description="Maximum source amount in UI units")
    route: Optional[List[Dict[str, Any]]] = None

# ==== NEW: 2-bước FE ký cho send/swap ====
class SubmitSignedTransactionReq(BaseModel):
    public_key: Optional[str] = None  # optional: BE có thể verify chữ ký thuộc về ai
    signed_transaction: str  # Base64 encoded signed transaction

class SendBeginReq(BaseModel):
    source_public: str
    destination: str
    token: TokenRef
    amount: str = Field(..., description="Amount in UI units (e.g., '1.0' for 1 SOL, '100.5' for 100.5 USDT)")

class SwapBeginSendReq(BaseModel):
    mode: Literal["send"] = "send"
    source_public: str
    destination: Optional[str] = None
    source_token: TokenRef
    source_amount: str = Field(..., description="Source amount in UI units (e.g., '1.0' for 1 SOL)")
    dest_token: TokenRef
    dest_min: str = Field(..., description="Minimum destination amount in UI units")
    route: Optional[List[Dict[str, Any]]] = None

class SwapBeginReceiveReq(BaseModel):
    mode: Literal["receive"] = "receive"
    source_public: str
    destination: Optional[str] = None
    dest_token: TokenRef
    dest_amount: str = Field(..., description="Destination amount in UI units (e.g., '100.0' for 100 USDT)")
    source_token: TokenRef
    source_max: str = Field(..., description="Maximum source amount in UI units")
    route: Optional[List[Dict[str, Any]]] = None

SwapBeginBody = Annotated[
    Union[SwapBeginSendReq, SwapBeginReceiveReq],
    Field(discriminator="mode")
]
