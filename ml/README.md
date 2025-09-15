# UnityWallet ML Service

Dịch vụ Machine Learning cho phân tích giao dịch blockchain, feature engineering và phát hiện bất thường.

## Tính năng chính

### 🔍 Feature Engineering
- **Số giao dịch/tháng**: Tính toán tần suất giao dịch theo thời gian
- **Biến động số dư**: Phân tích độ biến động của các tài sản
- **Tỷ lệ nợ/tài sản**: Đánh giá tình hình tài chính
- **Tần suất hoàn tiền**: Phát hiện pattern hoàn trả
- **Phân tích thời gian**: Giờ cao điểm, xu hướng theo ngày/tuần
- **Địa chỉ thường xuyên**: Người nhận tiền thường xuyên

### ⚠️ Phát hiện bất thường (Anomaly Detection)
- **Số tiền bất thường**: Giao dịch có số tiền khác biệt đáng kể
- **Tần suất cao**: Hoạt động giao dịch bất thường cao
- **Thời gian bất thường**: Giao dịch vào giờ không thường (2-5 AM)
- **Giao dịch liên tiếp**: Nhiều giao dịch trong thời gian ngắn
- **AI Detection**: Sử dụng Isolation Forest và Machine Learning
- **Pattern Analysis**: Phát hiện automated trading patterns

### 🤖 Chatbot Assistant
- Trả lời câu hỏi về giao dịch bằng tiếng Việt
- Phân tích thông minh dựa trên context
- Gợi ý câu hỏi theo hoạt động của wallet
- Tóm tắt thông tin tài chính cá nhân

## Cấu trúc API

### Analytics Endpoints
```
GET /analytics/wallet/{public_key}           # Phân tích toàn diện wallet
GET /analytics/features/{public_key}         # Chỉ lấy features
GET /analytics/summary/{public_key}          # Tóm tắt nhanh
GET /analytics/balance-history/{public_key}  # Lịch sử số dư
```

### Anomaly Detection Endpoints
```
GET /anomaly/check/{public_key}              # Kiểm tra bất thường
GET /anomaly/monitor/{public_key}            # Monitor thời gian thực
GET /anomaly/history/{public_key}            # Lịch sử anomalies
POST /anomaly/configure-alerts/{public_key}  # Cấu hình cảnh báo
```

### Chatbot Endpoints
```
POST /chat/ask                               # Chat với AI assistant
GET /chat/suggestions/{public_key}           # Gợi ý câu hỏi
POST /chat/quick-stats                       # Thống kê nhanh
```

## Cài đặt và chạy

### Requirements
```bash
cd ml/
pip install -r requirements.txt
```

### Environment
```bash
cp .env.example .env
# Chỉnh sửa cấu hình trong .env
```

### Chạy service
```bash
# Development
python main.py

# Production
uvicorn main:app --host 0.0.0.0 --port 8001
```

Service sẽ chạy tại `http://localhost:8001`

## API Documentation

Sau khi chạy service, truy cập:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

## Ví dụ sử dụng

### 1. Phân tích wallet
```bash
curl "http://localhost:8001/analytics/wallet/GCTIG4STIVQEJLECMZHVWMGBJGPNLHDBQV6FTDD3WK5DVVRDMAVYNEB7?days_back=30"
```

### 2. Kiểm tra bất thường
```bash
curl "http://localhost:8001/anomaly/check/GCTIG4STIVQEJLECMZHVWMGBJGPNLHDBQV6FTDD3WK5DVVRDMAVYNEB7"
```

### 3. Chat với AI
```bash
curl -X POST "http://localhost:8001/chat/ask" \
  -H "Content-Type: application/json" \
  -d '{
    "public_key": "GCTIG4STIVQEJLECMZHVWMGBJGPNLHDBQV6FTDD3WK5DVVRDMAVYNEB7",
    "message": "Số dư của tôi là bao nhiêu?"
  }'
```

## Dữ liệu phân tích

### Features được tính toán
- `total_transactions`: Tổng số giao dịch
- `transactions_per_month`: Giao dịch trung bình/tháng  
- `balance_volatility`: Độ biến động số dư theo asset
- `debt_to_asset_ratio`: Tỷ lệ chi/thu
- `refund_frequency`: Tần suất hoàn tiền
- `peak_transaction_hours`: Giờ giao dịch nhiều nhất
- `frequent_destinations`: Địa chỉ gửi tiền thường xuyên

### Anomaly Types
- `unusual_amount`: Số tiền bất thường
- `high_frequency`: Tần suất giao dịch cao
- `unusual_time`: Thời gian bất thường
- `rapid_transactions`: Giao dịch liên tiếp nhanh
- `ml_detected`: Phát hiện bởi ML algorithms

## Architecture

```
ml/
├── main.py                 # FastAPI app
├── core/
│   └── config.py          # Configuration settings
├── models/
│   └── schemas.py         # Pydantic models
├── services/
│   ├── data_collector.py  # Stellar data collection
│   ├── feature_engineering.py # Feature calculation
│   ├── anomaly_detection.py   # Anomaly detection
│   └── chatbot.py         # AI assistant
└── routers/
    ├── analytics.py       # Analytics endpoints
    ├── anomaly.py         # Anomaly endpoints
    └── chatbot.py         # Chatbot endpoints
```

## Tích hợp với Frontend

Frontend có thể gọi ML service để:

1. **Dashboard Analytics**: Hiển thị charts và metrics
2. **Security Alerts**: Cảnh báo bất thường real-time  
3. **AI Assistant**: Chat interface cho người dùng
4. **Transaction Insights**: Phân tích patterns và xu hướng

Ví dụ tích hợp trong React:
```javascript
// Lấy phân tích wallet
const analytics = await fetch(`/analytics/wallet/${publicKey}?days_back=30`);

// Kiểm tra bất thường
const anomalies = await fetch(`/anomaly/check/${publicKey}`);

// Chat với AI
const chatResponse = await fetch('/chat/ask', {
  method: 'POST',
  body: JSON.stringify({
    public_key: publicKey,
    message: userMessage
  })
});
```

## Roadmap

- [ ] **Database Integration**: Lưu trữ lịch sử phân tích
- [ ] **Real-time Monitoring**: WebSocket cho alerts
- [ ] **Advanced ML Models**: Deep learning cho pattern detection  
- [ ] **Multi-language Support**: Hỗ trợ nhiều ngôn ngữ
- [ ] **Performance Optimization**: Caching và optimization
- [ ] **Security Enhancement**: Rate limiting và authentication
