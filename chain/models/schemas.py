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

class Pubkey(BaseModel):
    public_key: str

class SignedXDR(BaseModel):
    xdr: str
    public_key: str

class TrustlineDemoReq(BaseModel):
    secret: str

# ==== Asset / Pool ====
class AssetRef(BaseModel):
    code: str
    issuer: Optional[str] = None  # có thể bỏ qua với XLM/SYP/USDC (resolver sẽ map từ .env)

class PoolRef(BaseModel):
    asset_a: AssetRef
    asset_b: AssetRef
    fee_bps: int = 30

# ==== Onboard ====
class OnboardBeginReq(BaseModel):
    public_key: str

class OnboardCompleteReq(BaseModel):
    public_key: str
    signed_xdr: str

# ==== Send ====
class SendEstimateReq(BaseModel):
    source: AssetRef
    amount: str
    destination: str

class SendExecReq(SendEstimateReq):
    secret: str

# ==== Swap (DEX/AMM) ====
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

class ExecuteSendReq(BaseModel):
    secret: str
    destination: str
    source_asset: AssetRef
    source_amount: str
    dest_asset: AssetRef
    dest_min: str
    path: Optional[List[Dict[str, Any]]] = None

class ExecuteReceiveReq(BaseModel):
    secret: str
    destination: str
    dest_asset: AssetRef
    dest_amount: str
    source_asset: AssetRef
    source_max: str
    path: Optional[List[Dict[str, Any]]] = None

# Endpoint execute hợp nhất
class ExecuteSwapReq(BaseModel):
    mode: Literal["send", "receive"]
    secret: str
    destination: Optional[str] = None  # nếu None -> mặc định ví người ký
    source_asset: AssetRef
    dest_asset: AssetRef
    # mode=send:
    source_amount: Optional[str] = None
    dest_min: Optional[str] = None
    # mode=receive:
    dest_amount: Optional[str] = None
    source_max: Optional[str] = None
    path: Optional[List[Dict[str, Any]]] = None

# ==== Dev/seed (tuỳ dự án) ====
class SeedAllReq(BaseModel):
    secret: str
    target_prices: Dict[str, float]
    amounts: Dict[str, Dict[str, str]]
    fee_bps: int = 30

# ==== DEX-friendly alias ====
class DexQuoteReq(BaseModel):
    side: Literal["sell", "buy"]        # sell = mode=send, buy = mode=receive
    from_code: str
    to_code: str
    amount: str                         # sell: amount_in; buy: amount_out mong muốn
    account: Optional[str] = None       
    slippage_bps: int = 200

class DexExecuteReq(BaseModel):
    side: Literal["sell", "buy"]
    secret: str                         # SB... của user
    from_code: str
    to_code: str
    amount: str                         # cùng nghĩa như trên
    destination: Optional[str] = None   # bỏ trống => ví người ký
    slippage_bps: int = 200
