# 🤖 Financial Copilot - AI Assistant cho Unity Wallet

## 🎯 Tổng quan

Financial Copilot là AI assistant tích hợp ML và LLM, được tối ưu đặc biệt cho **Acer Nitro 5**. Kết hợp machine learning analysis với natural language processing để cung cấp insights tài chính thông minh bằng tiếng Việt.

## ⚡ Tính năng chính

### 🧠 ML + LLM Integration
- **Fraud Detection**: Phát hiện giao dịch bất thường real-time
- **Credit Scoring**: Đánh giá và tư vấn cải thiện tín dụng  
- **Spending Analysis**: Phân tích chi tiêu theo danh mục
- **Savings Advice**: Gợi ý tiết kiệm cá nhân hóa

### 🎮 Tối ưu cho Nitro 5
- **Smart Model Routing**: Tự động chọn model phù hợp
- **Performance Optimization**: Tiết kiệm pin và giảm nhiệt
- **Multi-model Support**: Phi-3 Mini, Gemma 2B, Llama 3 8B
- **Vietnamese Language**: Tối ưu cho ngữ cảnh tài chính Việt Nam

## 🔧 Cài đặt

### Option 1: Auto Setup (Khuyến nghị)
```bash
cd /home/thaianh/Workspace/UnityWallet/ml
./setup_nitro5.sh
```

### Option 2: Manual Setup
```bash
# 1. Cài đặt Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Download models tối ưu cho Nitro 5
ollama pull phi3:mini        # Primary model (3.8GB)
ollama pull gemma:2b         # Speed model (1.4GB)  
ollama pull llama3:8b        # Quality model (4.7GB) - nếu RAM ≥16GB

# 3. Start Ollama service
ollama serve
```

## 🚀 Sử dụng

### Demo cơ bản
```bash
cd /home/thaianh/Workspace/UnityWallet/ml
python src/agent/financial_copilot_complete.py
```

### Interactive chat
```python
from src.agent.financial_copilot_complete import FinancialCopilot

copilot = FinancialCopilot(optimize_for_nitro5=True)
copilot.chat_interactive()
```

### API Usage
```python
import pandas as pd
from src.agent.financial_copilot_complete import FinancialCopilot

# Initialize
copilot = FinancialCopilot()

# Sample transaction data
transactions = pd.DataFrame([
    {"amount": 50000, "description": "Phở bò", "merchant": "Phở Hà Nội"},
    {"amount": 5000000, "description": "Chuyển khoản lạ", "merchant": "Unknown"}
])

# Chat with Financial Copilot
response = copilot.chat(
    "Có giao dịch bất thường nào không?", 
    "user123", 
    transactions
)

print(response['response'])
print("Suggestions:", response['suggestions'])
```

## 📊 Model Performance trên Nitro 5

| Model | Size | Speed | RAM | Use Case |
|-------|------|-------|-----|----------|
| **Phi-3 Mini** | 3.8GB | 15-25 tok/s | 4-6GB | **Recommended** - Best balance |
| **Gemma 2B** | 1.4GB | 25-40 tok/s | 2-3GB | Speed priority |
| **Llama 3 8B** | 4.7GB | 8-15 tok/s | 6-8GB | Quality priority |

## 🎯 Smart Model Routing

Financial Copilot tự động chọn model phù hợp:

```python
# Simple queries → Gemma 2B (nhanh)
"Bao nhiêu tiền tôi đã chi?"

# Complex analysis → Phi-3 Mini (balance)  
"Phân tích xu hướng chi tiêu của tôi"

# Heavy reasoning → Llama 3 8B (quality)
"Đưa ra strategy đầu tư dài hạn"
```

## 💬 Ví dụ Conversations

### 🔍 Fraud Detection
```
👤 User: "Giao dịch 5 triệu lúc 3h sáng có bất thường không?"

🤖 Copilot: 
⚠️ CẢNH BÁO GIAN LẬN
📊 Phân tích ML: FRAUD PROBABILITY 94%
🔍 Lý do:
• Thời gian bất thường (3AM vs 9AM-9PM)  
• Số tiền cao (5M vs trung bình 500K)
• Vị trí không khớp

💡 Gợi ý:
🔒 Khóa thẻ ngay lập tức
📞 Gọi hotline ngân hàng
📍 Báo cáo vị trí bất thường
```

### 💰 Savings Advice
```
👤 User: "Tư vấn tiết kiệm cho tôi"

🤖 Copilot:
💡 PHÂN TÍCH CHI TIÊU:
📊 Tổng chi: 8,500,000 VND
🍜 Ăn uống: 3,200,000 VND (38%)
🛒 Mua sắm: 2,100,000 VND (25%) 
🚗 Di chuyển: 1,800,000 VND (21%)

💡 GỢI Ý TIẾT KIỆM:
• Giảm 20% chi tiêu ăn uống → Tiết kiệm 640K
• Cook at home 3 ngày/tuần
• Sử dụng xe bus thay Grab

🎯 Mục tiêu: Tiết kiệm 1,200,000 VND/tháng
```

## 🔧 Configuration

### Nitro 5 Optimal Settings
```python
nitro5_config = {
    "primary_model": "phi3:mini",
    "fallback_model": "gemma:2b", 
    "max_tokens": 300,
    "temperature": 0.7,
    "timeout_seconds": 10,
    
    "routing": {
        "simple_queries": "gemma:2b",
        "complex_analysis": "phi3:mini", 
        "fraud_detection": "phi3:mini",
        "savings_advice": "phi3:mini"
    }
}
```

## 🛠️ Development

### Project Structure
```
ml/src/agent/
├── financial_copilot_complete.py  # Main Financial Copilot class
├── router.py                      # FastAPI endpoints  
├── llm_integration.py            # Multi-LLM provider support
├── frontend_guide.py             # React/Vue components
└── demo.py                       # Demo scenarios
```

### Testing
```bash
# Run unit tests
python -m pytest tests/

# Performance benchmark
python src/agent/nitro5_benchmark.py

# Interactive testing
python -c "from src.agent.financial_copilot_complete import FinancialCopilot; FinancialCopilot().chat_interactive()"
```

## 🌟 Why Financial Copilot > Raw Llama?

| Feature | Raw Llama | Financial Copilot |
|---------|-----------|-------------------|
| **ML Integration** | ❌ None | ✅ 4 ML models |
| **Performance** | 🐌 4-8s response | ⚡ 2-4s response |
| **Vietnamese Finance** | ⚠️ Generic | ✅ Specialized |
| **Real Actions** | ❌ Chat only | ✅ Buttons + Charts |
| **Nitro 5 Optimization** | ❌ Heavy | ✅ Smart routing |

## 📈 Roadmap

- [ ] **Web UI**: React dashboard với real-time charts
- [ ] **Mobile App**: Flutter app với push notifications  
- [ ] **Voice Assistant**: Speech-to-text Vietnamese
- [ ] **Bank Integration**: Direct API với ngân hàng VN
- [ ] **Investment Advice**: Tích hợp VN stock market data

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push branch: `git push origin feature/new-feature`
5. Submit Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🆘 Support

### Common Issues

**❓ Ollama not responding**
```bash
# Restart Ollama service
systemctl --user restart ollama
ollama serve
```

**❓ Model too slow**
```bash
# Switch to faster model
ollama pull gemma:2b
# Update config: "primary_model": "gemma:2b"
```

**❓ Out of memory**
```bash
# Check RAM usage
free -h
# Use smaller model or close other apps
```

### Contact
- GitHub Issues: [UnityWallet Issues](https://github.com/CrafterTA/UnityWallet/issues)
- Email: support@unitywallet.vn
- Discord: Unity Wallet Community

---

**🎮 Built for Acer Nitro 5 • 🇻🇳 Made for Vietnamese • 🤖 Powered by AI**
