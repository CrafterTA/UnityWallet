from pydantic import BaseModel

class Pubkey(BaseModel):
    public_key: str

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

class SignedXDR(BaseModel):
    xdr: str
    public_key: str

class TrustlineDemoReq(BaseModel):
    secret: str
