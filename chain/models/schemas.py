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
    secret: str
    fund: bool = True

class ImportMnemonicReq(BaseModel):
    mnemonic: str
    passphrase: str = ""
    account_index: int = 0
    fund: bool = True

# ==== Asset ====
class AssetRef(BaseModel):
    code: str
    issuer: Optional[str] = None

# ==== Onboard (FE ký) ====
class OnboardBeginReq(BaseModel):
    public_key: str

class OnboardCompleteReq(BaseModel):
    public_key: str
    signed_xdr: str

# ==== Send (estimate/execute cũ) ====
class SendEstimateReq(BaseModel):
    source: AssetRef
    amount: str
    destination: str

class SendExecReq(SendEstimateReq):
    secret: str

# ==== Swap (quote/execute cũ) ====
class QuoteSendReq(BaseModel):
    mode: Literal["send"] = "send"
    source_asset: AssetRef
    source_amount: str
    dest_asset: AssetRef
    source_account: Optional[str] = None
    max_paths: int = 5
    slippage_bps: int = 200

class QuoteReceiveReq(BaseModel):
    mode: Literal["receive"] = "receive"
    source_asset: AssetRef
    dest_asset: AssetRef
    dest_amount: str
    source_account: Optional[str] = None
    max_paths: int = 5
    slippage_bps: int = 200

QuoteBody = Annotated[
    Union[QuoteSendReq, QuoteReceiveReq],
    Field(discriminator="mode")
]

class ExecuteSwapReq(BaseModel):
    mode: Literal["send", "receive"]
    secret: str
    destination: Optional[str] = None
    source_asset: AssetRef
    dest_asset: AssetRef
    source_amount: Optional[str] = None
    dest_min: Optional[str] = None
    dest_amount: Optional[str] = None
    source_max: Optional[str] = None
    path: Optional[List[Dict[str, Any]]] = None

# ==== DEX-friendly (giữ nguyên) ====
class DexQuoteReq(BaseModel):
    side: Literal["sell", "buy"]
    from_code: str
    to_code: str
    amount: str
    account: Optional[str] = None
    slippage_bps: int = 200

class DexExecuteReq(BaseModel):
    side: Literal["sell", "buy"]
    secret: str
    from_code: str
    to_code: str
    amount: str
    destination: Optional[str] = None
    slippage_bps: int = 200

# ==== NEW: 2-bước FE ký cho send/swap ====
class SubmitSignedXDRReq(BaseModel):
    public_key: Optional[str] = None  # optional: BE có thể verify chữ ký thuộc về ai
    signed_xdr: str

class SendBeginReq(BaseModel):
    source_public: str
    destination: str
    asset: AssetRef
    amount: str

class SwapBeginSendReq(BaseModel):
    mode: Literal["send"] = "send"
    source_public: str
    destination: Optional[str] = None
    source_asset: AssetRef
    source_amount: str
    dest_asset: AssetRef
    dest_min: str
    path: Optional[List[Dict[str, Any]]] = None

class SwapBeginReceiveReq(BaseModel):
    mode: Literal["receive"] = "receive"
    source_public: str
    destination: Optional[str] = None
    dest_asset: AssetRef
    dest_amount: str
    source_asset: AssetRef
    source_max: str
    path: Optional[List[Dict[str, Any]]] = None

SwapBeginBody = Annotated[
    Union[SwapBeginSendReq, SwapBeginReceiveReq],
    Field(discriminator="mode")
]
