# UnityWallet - Complete ML Analytics System

Hệ thống phân tích machine learning hoàn chỉnh cho ví blockchain với feature engineering, anomaly detection và AI chatbot.

## 🎯 Tổng quan

UnityWallet ML Service cung cấp:

1. **Feature Engineering từ lịch sử giao dịch**
   - Số giao dịch/tháng
   - Biến động số dư theo asset
   - Tỷ lệ nợ/tài sản
   - Tần suất hoàn tiền
   - Phân tích patterns theo thời gian

2. **Cảnh báo bất thường (Anomaly Detection)**
   - Phát hiện giao dịch số tiền bất thường
   - Cảnh báo hoạt động tần suất cao
   - Phát hiện giao dịch vào giờ bất thường
   - AI-based pattern detection

3. **Trợ lý hội thoại (AI Chatbot)**
   - Trả lời câu hỏi về giao dịch bằng tiếng Việt
   - Phân tích thông minh theo context
   - Tùy chọn thời gian phân tích

## 🏗️ Architecture

```
UnityWallet/
├── chain/                 # Blockchain service (FastAPI)
│   ├── services/          # Stellar, payments, swap
│   ├── routers/           # API endpoints
│   └── main.py           # Chain service
├── frontend/             # React web app  
│   ├── src/
│   └── package.json
└── ml/                   # 🆕 ML Analytics Service
    ├── core/
    │   └── config.py     # Configuration
    ├── models/
    │   └── schemas.py    # Pydantic models
    ├── services/
    │   ├── data_collector.py      # Stellar data collection
    │   ├── feature_engineering.py # Feature calculation
    │   ├── anomaly_detection.py   # Anomaly detection
    │   └── chatbot.py            # AI assistant
    ├── routers/
    │   ├── analytics.py   # Analytics API
    │   ├── anomaly.py     # Anomaly API
    │   └── chatbot.py     # Chatbot API
    ├── main.py           # ML service entry point
    ├── demo.py           # Demo script
    └── README.md         # Documentation
```

## 🚀 Quick Start

### 1. Chạy Chain Service (Port 8000)
```bash
cd chain/
pip install -r requirements.txt
python main.py
```

### 2. Chạy ML Service (Port 8001)
```bash
cd ml/
chmod +x start.sh
./start.sh
```

### 3. Chạy Frontend (Port 5173)
```bash
cd frontend/
npm install
npm run dev
```

## 📊 API Endpoints Overview

### Chain Service (Port 8000)
```
POST /wallet/create              # Tạo ví mới
POST /wallet/import              # Import ví
GET  /wallet/balances            # Xem số dư
POST /send/estimate              # Ước tính phí gửi
POST /send/execute               # Thực hiện gửi
POST /swap/quote                 # Ước tính swap
POST /swap/execute               # Thực hiện swap
```

### ML Service (Port 8001)
```
# Analytics
GET  /analytics/wallet/{public_key}      # Phân tích toàn diện
GET  /analytics/features/{public_key}    # Feature engineering
GET  /analytics/summary/{public_key}     # Tóm tắt nhanh

# Anomaly Detection  
GET  /anomaly/check/{public_key}         # Kiểm tra bất thường
GET  /anomaly/monitor/{public_key}       # Monitor real-time
GET  /anomaly/history/{public_key}       # Lịch sử anomalies

# AI Chatbot
POST /chat/ask                           # Chat với AI
GET  /chat/suggestions/{public_key}      # Gợi ý câu hỏi
```

## 💡 Feature Engineering Details

### Transaction Metrics
- `total_transactions`: Tổng số giao dịch trong period
- `transactions_per_month`: Trung bình giao dịch/tháng
- `payment_count`: Số lượng payment transactions
- `swap_count`: Số lượng swap transactions

### Balance Analysis  
- `balance_volatility`: Độ biến động số dư (standard deviation)
- `max_balance`, `min_balance`, `avg_balance`: Thống kê số dư
- `debt_to_asset_ratio`: Tỷ lệ tổng chi/tổng thu

### Pattern Detection
- `refund_frequency`: Tần suất giao dịch hoàn trả
- `peak_transaction_hours`: Giờ có nhiều giao dịch nhất
- `frequent_destinations`: Top địa chỉ gửi tiền thường xuyên
- `large_transaction_count`: Số giao dịch lớn (>95th percentile)

## ⚠️ Anomaly Types

| Type | Description | Severity |
|------|-------------|----------|
| `unusual_amount` | Số tiền khác biệt đáng kể (Z-score > 3) | Medium |
| `high_frequency` | Quá nhiều giao dịch trong ngày | Medium |
| `unusual_time` | Giao dịch 2-5 AM | High |
| `rapid_transactions` | Giao dịch liên tiếp <1 phút | High |
| `ml_detected` | AI phát hiện pattern bất thường | Medium |
| `round_number_bias` | >80% giao dịch số tròn | Low |

## 🤖 AI Chatbot Capabilities

### Supported Intents
- **Balance Inquiry**: "Số dư của tôi là bao nhiêu?"
- **Transaction Count**: "Tôi đã thực hiện bao nhiêu giao dịch?"
- **Spending Analysis**: "Phân tích chi tiêu của tôi"
- **Anomaly Check**: "Có hoạt động bất thường nào không?"
- **Time Analysis**: "Tôi thường giao dịch vào giờ nào?"
- **Destination Analysis**: "Tôi gửi tiền cho ai nhiều nhất?"

### Context Awareness
- Tự động điều chỉnh thời gian phân tích (ngày/tuần/tháng)
- Gợi ý câu hỏi dựa trên hoạt động wallet
- Masked addresses để bảo vệ privacy
- Đa ngữ (Vietnamese/English)

## 🔧 Configuration

### ML Service Environment (.env)
```bash
# Stellar Network
HORIZON_URL=https://horizon-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Chain Service Integration
CHAIN_SERVICE_URL=http://localhost:8000

# ML Configuration
MODEL_PATH=./models
LOOKBACK_DAYS=90
ANOMALY_THRESHOLD=0.05

# Performance
CACHE_TTL_SECONDS=300
MAX_PAGE_SIZE=1000
```

## 📊 Demo & Testing

### Chạy Demo
```bash
cd ml/
python demo.py
```

### Test với curl
```bash
# Phân tích wallet
curl "http://localhost:8001/analytics/wallet/GCTIG4...?days_back=30"

# Kiểm tra anomalies
curl "http://localhost:8001/anomaly/check/GCTIG4..."

# Chat với AI
curl -X POST "http://localhost:8001/chat/ask" \
  -H "Content-Type: application/json" \
  -d '{"public_key": "GCTIG4...", "message": "Số dư của tôi?"}'
```

## 🔗 Frontend Integration

Frontend có thể tích hợp ML analytics vào dashboard:

```javascript
// Analytics Dashboard
const analytics = await fetch(`/analytics/wallet/${publicKey}`);
const features = analytics.features;

// Security Alerts
const anomalies = await fetch(`/anomaly/check/${publicKey}`);
if (anomalies.risk_score > 0.7) showAlert();

// AI Chat Component
const chatResponse = await fetch('/chat/ask', {
  method: 'POST',
  body: JSON.stringify({ public_key: publicKey, message: userMessage })
});
```

## 🛠️ Development

### Adding New Features
1. Tạo feature calculation trong `services/feature_engineering.py`
2. Thêm vào `FeatureEngineering` model trong `models/schemas.py`
3. Update API response trong `routers/analytics.py`

### Adding New Anomaly Types
1. Implement detection logic trong `services/anomaly_detection.py`
2. Thêm type description trong `/anomaly/types` endpoint
3. Update chatbot để hiểu anomaly type mới

### Extending Chatbot
1. Thêm intent patterns trong `services/chatbot.py`
2. Implement handler function cho intent
3. Thêm translations và suggestions

## 📈 Roadmap

### Phase 1 (Completed)
- ✅ Feature engineering từ blockchain data
- ✅ Anomaly detection với ML algorithms
- ✅ AI chatbot với Vietnamese support
- ✅ REST API cho tất cả features

### Phase 2 (Future)
- [ ] Database persistence cho historical data
- [ ] Real-time WebSocket alerts
- [ ] Advanced ML models (Deep Learning)
- [ ] Multi-wallet portfolio analysis
- [ ] Performance optimization & caching

### Phase 3 (Future)
- [ ] Predictive analytics
- [ ] Risk scoring models
- [ ] Automated trading suggestions
- [ ] Multi-blockchain support

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Implement changes với tests
4. Submit pull request với documentation

## 📄 License

MIT License - xem file LICENSE

---

**UnityWallet ML Service** - Bringing AI intelligence to blockchain analytics! 🚀✨
