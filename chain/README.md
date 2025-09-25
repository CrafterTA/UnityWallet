# Solana Wallet API

Đây là API backend cho ví tiền điện tử trên mạng Solana với hỗ trợ USDT (Tether).

## 🚀 Tính năng chính

- **Quản lý ví**: Tạo, import ví từ mnemonic hoặc private key
- **Gửi tiền**: Chuyển SOL và USDT tokens
- **Hoán đổi**: Swap tokens qua Jupiter DEX
- **Onboarding**: Quy trình đăng ký tài khoản
- **Lịch sử**: Xem lịch sử giao dịch

## 📋 Yêu cầu hệ thống

- Python 3.8+
- Solana RPC endpoint (devnet)

## 🛠️ Cài đặt

1. **Cài đặt dependencies**:
```bash
pip install -r requirements.txt
```

2. **Cấu hình environment**:
Tạo file `.env` với nội dung:
```env
# Solana Network Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_COMMITMENT=confirmed
SOLANA_NETWORK=devnet

# USDT Configuration (Devnet USDT)
USDT_MINT=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
USDT_AUTHORITY=

# Faucet Configuration
FAUCET_URL=https://faucet.solana.com
```

3. **Chạy server**:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📚 API Endpoints

### Wallet Management
- `POST /wallet/create` - Tạo ví mới
- `POST /wallet/import` - Import ví từ private key
- `POST /wallet/import-mnemonic` - Import ví từ mnemonic
- `GET /wallet/balances` - Xem số dư
- `GET /wallet/balances/refresh` - Refresh số dư (với retry mechanism)

### Send/Transfer
- `POST /send/estimate` - Ước tính phí giao dịch
- `POST /send/validate` - Validate send request (frontend pre-check)
- `POST /send/begin` - Tạo transaction để frontend ký
- `POST /send/complete` - Submit transaction đã ký
- `POST /send/execute` - Gửi tiền (backend ký - legacy)

### Swap
- `POST /swap/validate` - Validate swap request (frontend pre-check)
- `POST /swap/quote` - Lấy quote swap
- `POST /swap/begin` - Tạo swap transaction để frontend ký
- `POST /swap/complete` - Submit swap transaction đã ký
- `POST /swap/execute` - Thực hiện swap (backend ký - legacy)

### Onboarding
- `POST /onboard/begin` - Bắt đầu onboarding
- `POST /onboard/complete` - Hoàn thành onboarding

### Transaction History
- `GET /tx/lookup` - Tra cứu giao dịch
- `GET /tx/history` - Lịch sử giao dịch

## 🔧 Cấu hình

### Network
- **Devnet**: Mạng test của Solana
- **RPC URL**: Endpoint để kết nối với Solana
- **Commitment**: Mức độ xác nhận giao dịch

### Tokens
- **USDT**: Tether USD trên Solana (6 decimals)
- **SOL**: Native token của Solana

### Amount Format
API hỗ trợ **UI amounts** thân thiện với người dùng:
- **SOL**: Nhập `"1.0"` thay vì `"1000000000"` (1 SOL = 1,000,000,000 lamports)
- **USDT**: Nhập `"100.5"` thay vì `"100500000"` (1 USDT = 1,000,000 smallest units)
- **Tự động conversion**: API sẽ tự động chuyển đổi UI amounts thành đơn vị nhỏ nhất

### 🔧 Parameters cần thay thế
Trong các ví dụ dưới, các trường có prefix `change_here_` cần được thay thế:

| Trường | Mô tả | Ví dụ |
|--------|-------|-------|
| `change_here_your_public_key` | Public key của ví bạn | `"9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"` |
| `change_here_recipient_public_key` | Public key người nhận | `"5FHwkVj6K8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q"` |
| `change_here_your_12_or_24_word_mnemonic_phrase` | Mnemonic phrase 12 hoặc 24 từ | `"abandon abandon abandon..."` |
| `change_here_minimum_usdt_amount_from_quote` | Số USDT tối thiểu từ quote | `"95.5"` (từ response của /swap/quote) |
| `change_here_signed_transaction_base64` | Transaction đã ký (base64) | `"AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAED..."` |
| `change_here_transaction_signature` | Signature của giao dịch | `"5J7X8Y9Z..."` |

### 📋 Token References
| Token | Mint Address | Decimals | Symbol |
|-------|-------------|----------|--------|
| **SOL** | `"native"` hoặc `"So11111111111111111111111111111111111111112"` | 9 | SOL |
| **USDT** | `"Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"` | 6 | USDT |

### ✅ Required vs Optional Fields

#### **Token Object**:
- ✅ **Required**: `mint` (token address)
- ⚪ **Optional**: `symbol`, `decimals` (API sẽ tự detect)

#### **Send/Swap Requests**:
- ✅ **Required**: `source_public`, `destination`, `amount`
- ⚪ **Optional**: `destination` (cho swap, mặc định = source_public)

#### **Mnemonic Import**:
- ✅ **Required**: `mnemonic`
- ⚪ **Optional**: `passphrase` (mặc định = ""), `account_index` (mặc định = 0)

## 🔐 Bảo mật

- **Frontend Signing**: Private key không bao giờ rời khỏi client
- **Transaction Validation**: Kiểm tra chữ ký trước khi submit
- **Environment Variables**: Cấu hình nhạy cảm được lưu trong .env

## 🌐 Tích hợp

### Jupiter DEX
API sử dụng Jupiter để thực hiện swap tokens:
- Tự động tìm route tốt nhất
- Hỗ trợ nhiều DEX
- Quản lý slippage

### SPL Token
- Hỗ trợ đầy đủ SPL Token standard
- Tự động tạo token accounts
- Transfer tokens an toàn

## 🔄 Workflow sử dụng

### Quy trình cơ bản:
1. **Tạo/Import ví** → Lấy `public_key` và `secret`
2. **Kiểm tra số dư** → Xem SOL/USDT available
3. **Gửi tiền**: 
   - Tạo transaction (`/send/begin`)
   - Ký trên frontend
   - Submit (`/send/complete`)
4. **Swap tokens**:
   - Lấy quote (`/swap/quote`)
   - Tạo transaction (`/swap/begin`)
   - Ký trên frontend
   - Submit (`/swap/complete`)
5. **Kiểm tra giao dịch** → Tra cứu signature

### ⚠️ Lưu ý quan trọng:
- **Private key**: Chỉ dùng trên frontend, không gửi lên server
- **Frontend signing**: Khuyến nghị cho bảo mật
- **Backend signing**: Chỉ dùng cho testing (legacy endpoints)
- **Balance updates**: Sau giao dịch, số dư có thể cần thời gian để cập nhật (2-5 giây)

## 📖 Ví dụ sử dụng

### 1. Tạo ví mới
```bash
curl -X POST "http://localhost:8000/wallet/create" \
  -H "Content-Type: application/json" \
  -d '{
    "use_mnemonic": true,
    "words": 12,
    "fund": true
  }'
```
**Response**: Trả về mnemonic, public_key, secret (lưu lại để sử dụng)

### 2. Import ví từ mnemonic
```bash
curl -X POST "http://localhost:8000/wallet/import-mnemonic" \
  -H "Content-Type: application/json" \
  -d '{
    "mnemonic": "change_here_your_12_or_24_word_mnemonic_phrase",
    "passphrase": "",
    "account_index": 0,
    "fund": false
  }'
```
**Lưu ý**: `passphrase` và `account_index` có thể bỏ trống nếu không cần

### 3. Xem số dư
```bash
curl -X GET "http://localhost:8000/wallet/balances?public_key=change_here_your_public_key"
```

### 3b. Refresh số dư (sau giao dịch)
```bash
# Refresh ngay lập tức
curl -X GET "http://localhost:8000/wallet/balances/refresh?public_key=change_here_your_public_key"

# Refresh với chờ confirmation (khuyến nghị sau giao dịch)
curl -X GET "http://localhost:8000/wallet/balances/refresh?public_key=change_here_your_public_key&wait_for_confirmation=true"
```

### 4a. Validate Send Request (Khuyến nghị)
```bash
curl -X POST "http://localhost:8000/send/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "source_public": "change_here_your_public_key",
    "destination": "change_here_recipient_public_key", 
    "token": {
      "mint": "native"
    },
    "amount": "1.0"
  }'
```
**Response**: Kiểm tra `valid`, `errors`, `balance_info` trước khi tạo transaction

### 4b. Gửi SOL (Frontend Signing)
```bash
# Bước 1: Tạo transaction
curl -X POST "http://localhost:8000/send/begin" \
  -H "Content-Type: application/json" \
  -d '{
    "source_public": "change_here_your_public_key",
    "destination": "change_here_recipient_public_key", 
    "token": {
      "mint": "native"
    },
    "amount": "1.0"
  }'

# Bước 2: Ký transaction trên frontend và submit
curl -X POST "http://localhost:8000/send/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "public_key": "change_here_your_public_key",
    "signed_transaction": "change_here_signed_transaction_base64"
  }'
```
**Lưu ý**: Trong `token` object, chỉ cần `mint` là bắt buộc, `symbol` và `decimals` là optional

### 5. Gửi USDT (Frontend Signing)
```bash
# Bước 1: Tạo transaction
curl -X POST "http://localhost:8000/send/begin" \
  -H "Content-Type: application/json" \
  -d '{
    "source_public": "change_here_your_public_key",
    "destination": "change_here_recipient_public_key", 
    "token": {
      "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
    },
    "amount": "100.5"
  }'

# Bước 2: Ký transaction trên frontend và submit
curl -X POST "http://localhost:8000/send/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "public_key": "change_here_your_public_key",
    "signed_transaction": "change_here_signed_transaction_base64"
  }'
```
**Lưu ý**: Chỉ cần `mint` address, API sẽ tự động detect decimals

### 6a. Validate Swap Request (Khuyến nghị)
```bash
curl -X POST "http://localhost:8000/swap/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "send",
    "source_token": {
      "mint": "So11111111111111111111111111111111111111112"
    },
    "dest_token": {
      "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
    },
    "source_amount": "1.0",
    "source_account": "change_here_your_public_key",
    "slippage_bps": 200
  }'
```
**Response**: Kiểm tra `valid`, `errors`, `balance_info` trước khi lấy quote

### 6b. Lấy quote swap SOL → USDT
```bash
curl -X POST "http://localhost:8000/swap/quote" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "send",
    "source_token": {
      "mint": "So11111111111111111111111111111111111111112"
    },
    "dest_token": {
      "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
    },
    "source_amount": "1.0",
    "source_account": "change_here_your_public_key",
    "slippage_bps": 200
  }'
```

### 7a. Thực hiện swap SOL → USDT (Backend ký - Legacy)
```bash
curl -X POST "http://localhost:8000/swap/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "send",
    "secret": "change_here_your_private_key",
    "source_token": {
      "mint": "So11111111111111111111111111111111111111112"
    },
    "source_amount": "1.0",
    "dest_token": {
      "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
    },
    "dest_min": "change_here_minimum_usdt_amount_from_quote"
  }'
```
**⚠️ Lưu ý**: Backend signing không khuyến nghị cho production

### 7b. Thực hiện swap SOL → USDT (Frontend ký - Khuyến nghị)
```bash
# Bước 1: Tạo transaction
curl -X POST "http://localhost:8000/swap/begin" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "send",
    "source_public": "change_here_your_public_key",
    "source_token": {
      "mint": "So11111111111111111111111111111111111111112"
    },
    "source_amount": "1.0",
    "dest_token": {
      "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
    },
    "dest_min": "change_here_minimum_usdt_amount_from_quote"
  }'

# Bước 2: Ký transaction trên frontend và submit
curl -X POST "http://localhost:8000/swap/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "public_key": "change_here_your_public_key",
    "signed_transaction": "change_here_signed_transaction_base64"
  }'
```

### 8. Tra cứu giao dịch
```bash
curl -X GET "http://localhost:8000/tx/lookup?signature=change_here_transaction_signature"
```

### 9. Xem lịch sử giao dịch
```bash
curl -X GET "http://localhost:8000/tx/history?public_key=change_here_your_public_key&limit=10"
```

## 📋 Response Examples

### Send Validate Response
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "balance_info": {
    "token": "SOL",
    "current_balance": "1.5",
    "required_amount": "1.0",
    "estimated_fee": "0.000005",
    "total_required": "1.000005"
  },
  "fee_info": {
    "estimated_base_fee": 5000,
    "estimated_base_fee_sol": "0.000005",
    "note": "Actual fee may vary based on network conditions"
  }
}
```

### Send Complete Response
```json
{
  "success": true,
  "signature": "5J7X8Y9Z...",
  "transaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAED...",
  "balances": {
    "SOL": {
      "balance": "499000000",
      "balance_ui": "0.499",
      "mint": "native",
      "decimals": 9,
      "symbol": "SOL"
    },
    "USDT": {
      "balance": "1000000",
      "balance_ui": "1.0",
      "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      "decimals": 6,
      "symbol": "USDT"
    }
  },
  "balance_changes": {
    "SOL": {
      "before": "1.5",
      "after": "0.499",
      "change": "-1.001000000"
    }
  },
  "explorer_link": "https://explorer.solana.com/tx/5J7X8Y9Z...?cluster=devnet",
  "solscan_link": "https://solscan.io/tx/5J7X8Y9Z...?cluster=devnet",
  "network": "devnet",
  "note": "Transaction submitted successfully. Balances updated after confirmation.",
  "status": "completed"
}
```

### Swap Validate Response
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "balance_info": {
    "token": "SOL",
    "current_balance": "1.5",
    "required_amount": "1.0",
    "sufficient": true
  },
  "swap_info": {
    "mode": "send",
    "source_token": "So11111111111111111111111111111111111111112",
    "dest_token": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    "slippage_bps": 200,
    "slippage_percent": "2.00%"
  }
}
```

### Swap Quote Response
```json
{
  "found": true,
  "mode": "send",
  "source_token": "So11111111111111111111111111111111111111112",
  "destination_token": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  "source_amount": "1.0000000",
  "destination_amount": "95.5000000",
  "implied_price": "95.5000000",
  "implied_price_inverse": "0.0104712",
  "slippage_bps": 200,
  "dest_min_suggest": "93.5900000",
  "route_tokens": ["So11111111111111111111111111111111111111112", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"],
  "quote_metadata": {
    "timestamp": 1703123456,
    "slippage_bps": 200,
    "slippage_percent": "2.00%",
    "network": "devnet",
    "quote_valid_for": "30 seconds"
  }
}
```

### Swap Execute Response (Backend)
```json
{
  "signature": "5J7X8Y9Z...",
  "transaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAED...",
  "balances": {
    "SOL": {
      "balance": "499000000",
      "balance_ui": "0.499",
      "mint": "native",
      "decimals": 9,
      "symbol": "SOL"
    },
    "USDT": {
      "balance": "95500000",
      "balance_ui": "95.5",
      "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      "decimals": 6,
      "symbol": "USDT"
    }
  },
  "balance_changes": {
    "SOL": {
      "before": "1.5",
      "after": "0.499",
      "change": "-1.001000000"
    },
    "USDT": {
      "before": "0.0",
      "after": "95.5",
      "change": "+95.500000"
    }
  },
  "swap_info": {
    "mode": "send",
    "source_token": "So11111111111111111111111111111111111111112",
    "dest_token": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    "source_amount": "1.0",
    "dest_min": "93.59"
  },
  "explorer_link": "https://explorer.solana.com/tx/5J7X8Y9Z...?cluster=devnet",
  "solscan_link": "https://solscan.io/tx/5J7X8Y9Z...?cluster=devnet"
}
```

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **"Invalid secret key"**: 
   - ❌ Sai: Private key không đúng format base58
   - ✅ Sửa: Kiểm tra private key từ ví hoặc mnemonic

2. **"Account not found"**: 
   - ❌ Sai: Tài khoản chưa được tạo trên blockchain
   - ✅ Sửa: Gửi một ít SOL để tạo account trước

3. **"No route found"**: 
   - ❌ Sai: Không tìm thấy route swap cho token pair
   - ✅ Sửa: Kiểm tra token addresses, thử amount nhỏ hơn

4. **"Transaction failed"**: 
   - ❌ Sai: Giao dịch bị từ chối bởi network
   - ✅ Sửa: Kiểm tra số dư, network fee, thử lại

5. **"Source token account not found"**: 
   - ❌ Sai: Chưa có token account cho token này
   - ✅ Sửa: Cần tạo token account trước khi transfer

6. **"Invalid amount format"**: 
   - ❌ Sai: Nhập sai format amount
   - ✅ Sửa: Dùng UI amounts như "1.0", "100.5"

7. **"Balance không cập nhật sau giao dịch"**: 
   - ❌ Sai: Transaction chưa được confirm hoặc network delay
   - ✅ Sửa: Dùng `/wallet/balances/refresh?wait_for_confirmation=true` hoặc chờ 2-5 giây

### Debug

- Kiểm tra logs của server
- Xem transaction trên Solana Explorer
- Verify RPC endpoint hoạt động

## 📝 Changelog

### v2.1.0 (USDT Support)
- ✅ Thay thế SYP bằng USDT (Tether)
- ✅ Cập nhật cấu hình cho USDT devnet
- ✅ Loại bỏ hoàn toàn các file Stellar
- ✅ Tối ưu hóa cho USDT (6 decimals)
- ✅ Xóa tính năng airdrop token

### v2.0.0 (Solana Migration)
- ✅ Chuyển đổi từ Stellar sang Solana
- ✅ Tích hợp Jupiter DEX
- ✅ Hỗ trợ SPL Token
- ✅ Frontend signing support
- ✅ Devnet configuration

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.
