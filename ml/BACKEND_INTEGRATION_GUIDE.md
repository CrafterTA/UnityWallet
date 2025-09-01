# 🔌 Backend Integration Guide - Financial Copilot

## 🎯 Tổng quan Architecture

```
Unity Wallet Frontend (React/Vue) 
           ↓ HTTP/WebSocket
Financial Copilot API (FastAPI)
           ↓ AsyncIO 
Unity Wallet Backend (Your existing APIs)
           ↓ Database queries
Real Transaction Data
```

## 🚀 Quick Start Integration

### 1. Start Financial Copilot API Server

```bash
cd /home/thaianh/Workspace/UnityWallet/ml

# Install dependencies
pip install fastapi uvicorn aiohttp

# Start API server
python -m src.agent.api_server

# Server runs on: http://localhost:8001
```

### 2. Configure Backend URLs

Trong `src/agent/api_server.py`, update:

```python
# Line 65: Update with your actual backend URL
backend_url = "http://your-unity-wallet-backend:8000"
api_key = "your-backend-api-key"
```

## 📡 API Endpoints

### Chat API
```http
POST /api/v1/chat
Content-Type: application/json

{
  "message": "Có giao dịch bất thường nào không?",
  "user_id": "user123",
  "context": {}
}
```

**Response:**
```json
{
  "response": "🔍 Phân tích 50 giao dịch gần nhất...\n⚠️ Phát hiện 2 giao dịch bất thường:\n- 5,000,000 VND lúc 3:00 AM\n- Merchant không xác định",
  "intent": "fraud_detection",
  "model_used": "phi3:mini",
  "suggestions": [
    "🔒 Khóa thẻ ngay lập tức",
    "📞 Gọi hotline ngân hàng"
  ],
  "data_source": "backend",
  "timestamp": "2024-08-21T10:30:00"
}
```

### Fraud Detection API
```http
POST /api/v1/fraud-check
Content-Type: application/json

{
  "user_id": "user123",
  "transaction_id": "txn_456"
}
```

### Spending Analysis API
```http
POST /api/v1/spending-analysis
Content-Type: application/json

{
  "user_id": "user123",
  "period": "month"
}
```

### WebSocket Real-time Chat
```javascript
const ws = new WebSocket('ws://localhost:8001/ws/chat/user123');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Copilot response:', data);
};

ws.send("Tôi chi tiêu bao nhiêu tuần này?");
```

## 🔧 Backend APIs Required

Financial Copilot cần các APIs sau từ Unity Wallet Backend:

### 1. Transactions API
```http
GET /api/v1/transactions?user_id={user_id}&start_date={date}&limit=100
```

**Expected Response:**
```json
{
  "transactions": [
    {
      "id": "txn_123",
      "user_id": "user123",
      "amount": 50000,
      "description": "Phở bò",
      "merchant": "Phở Hà Nội",
      "category": "dining",
      "timestamp": "2024-08-21T08:30:00Z",
      "location": "Hanoi",
      "mcc": "5812"
    }
  ]
}
```

### 2. Balance API
```http
GET /api/v1/accounts/balance?user_id={user_id}
```

**Expected Response:**
```json
{
  "main_balance": 5000000,
  "savings_balance": 2000000,
  "total_balance": 7000000,
  "currency": "VND"
}
```

### 3. Spending Analytics API
```http
GET /api/v1/analytics/spending?user_id={user_id}&period=month
```

**Expected Response:**
```json
{
  "total_amount": 3500000,
  "categories": {
    "dining": 1200000,
    "shopping": 800000,
    "transport": 500000,
    "entertainment": 600000
  },
  "period": "2024-08",
  "transaction_count": 45
}
```

### 4. Fraud Alerts API
```http
GET /api/v1/security/fraud-alerts?user_id={user_id}
```

**Expected Response:**
```json
{
  "alerts": [
    {
      "id": "alert_123",
      "type": "unusual_amount",
      "severity": "high",
      "description": "Giao dịch lớn bất thường",
      "transaction_id": "txn_456",
      "timestamp": "2024-08-21T03:00:00Z"
    }
  ]
}
```

### 5. Credit Score API
```http
GET /api/v1/credit/score?user_id={user_id}
```

**Expected Response:**
```json
{
  "score": 750,
  "rating": "Good",
  "factors": {
    "payment_history": 85,
    "credit_utilization": 25,
    "credit_age": 60
  },
  "last_updated": "2024-08-21T00:00:00Z"
}
```

### 6. Budgets API
```http
GET /api/v1/budgets?user_id={user_id}
```

**Expected Response:**
```json
{
  "budgets": [
    {
      "category": "dining",
      "limit": 1500000,
      "spent": 1200000,
      "period": "monthly"
    },
    {
      "category": "shopping", 
      "limit": 1000000,
      "spent": 1200000,
      "period": "monthly"
    }
  ]
}
```

### 7. Savings Goals API
```http
GET /api/v1/savings/goals?user_id={user_id}
```

**Expected Response:**
```json
{
  "goals": [
    {
      "id": "goal_123",
      "name": "Mua laptop",
      "target_amount": 20000000,
      "current_amount": 5000000,
      "target_date": "2024-12-31",
      "start_date": "2024-01-01"
    }
  ]
}
```

## 🔌 Frontend Integration Examples

### React Integration

```javascript
// FinancialCopilot.jsx
import React, { useState, useEffect } from 'react';

const FinancialCopilot = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setMessages(prev => [...prev, { type: 'user', content: input }]);
    
    try {
      const response = await fetch('http://localhost:8001/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          user_id: userId
        })
      });
      
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        type: 'copilot', 
        content: data.response,
        suggestions: data.suggestions 
      }]);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div className="financial-copilot">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            <p>{msg.content}</p>
            {msg.suggestions && (
              <div className="suggestions">
                {msg.suggestions.map((suggestion, i) => (
                  <button key={i} className="suggestion-btn">
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi Financial Copilot..."
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? '⏳' : '🚀'}
        </button>
      </div>
    </div>
  );
};

export default FinancialCopilot;
```

### Vue.js Integration

```vue
<!-- FinancialCopilot.vue -->
<template>
  <div class="financial-copilot">
    <div class="chat-header">
      <h3>🤖 Financial Copilot</h3>
      <span class="status" :class="connectionStatus">{{ connectionStatus }}</span>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div v-for="(message, index) in messages" :key="index" 
           :class="['message', message.type]">
        <div class="message-content">{{ message.content }}</div>
        <div v-if="message.suggestions" class="suggestions">
          <button v-for="suggestion in message.suggestions" 
                  :key="suggestion"
                  @click="sendMessage(suggestion)"
                  class="suggestion-btn">
            {{ suggestion }}
          </button>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <input v-model="inputMessage" 
             @keyup.enter="sendMessage()"
             placeholder="Hỏi về tài chính của bạn..."
             :disabled="loading" />
      <button @click="sendMessage()" :disabled="loading">
        {{ loading ? '⏳' : '💬' }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FinancialCopilot',
  props: {
    userId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      messages: [],
      inputMessage: '',
      loading: false,
      connectionStatus: 'connected'
    }
  },
  async mounted() {
    // Initial greeting
    await this.sendMessage("Xin chào! Tôi cần hỗ trợ gì?");
  },
  methods: {
    async sendMessage(message = null) {
      const messageToSend = message || this.inputMessage;
      if (!messageToSend.trim()) return;
      
      this.loading = true;
      
      // Add user message
      if (!message) {
        this.messages.push({ type: 'user', content: messageToSend });
      }
      
      try {
        const response = await fetch('http://localhost:8001/api/v1/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageToSend,
            user_id: this.userId
          })
        });
        
        const data = await response.json();
        
        // Add copilot response
        this.messages.push({
          type: 'copilot',
          content: data.response,
          suggestions: data.suggestions,
          intent: data.intent
        });
        
        this.connectionStatus = 'connected';
        
      } catch (error) {
        console.error('Error:', error);
        this.connectionStatus = 'error';
        this.messages.push({
          type: 'error',
          content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.'
        });
      } finally {
        this.loading = false;
        this.inputMessage = '';
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      container.scrollTop = container.scrollHeight;
    }
  }
}
</script>

<style scoped>
.financial-copilot {
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  background: #f5f5f5;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status.connected { color: green; }
.status.error { color: red; }

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.message {
  margin-bottom: 10px;
}

.message.user {
  text-align: right;
}

.message.user .message-content {
  background: #007bff;
  color: white;
  padding: 8px 12px;
  border-radius: 18px;
  display: inline-block;
  max-width: 70%;
}

.message.copilot .message-content {
  background: #f1f1f1;
  padding: 8px 12px;
  border-radius: 18px;
  display: inline-block;
  max-width: 80%;
}

.suggestions {
  margin-top: 5px;
}

.suggestion-btn {
  background: #e9ecef;
  border: 1px solid #ced4da;
  border-radius: 15px;
  padding: 5px 10px;
  margin: 2px;
  cursor: pointer;
  font-size: 12px;
}

.suggestion-btn:hover {
  background: #dee2e6;
}

.chat-input {
  display: flex;
  padding: 10px;
  border-top: 1px solid #ddd;
}

.chat-input input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 20px;
  margin-right: 10px;
}

.chat-input button {
  padding: 8px 15px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}
</style>
```

## 🔄 Environment Configuration

### Development
```bash
# .env.development
COPILOT_API_URL=http://localhost:8001
BACKEND_API_URL=http://localhost:8000
COPILOT_API_KEY=dev-api-key
```

### Production  
```bash
# .env.production
COPILOT_API_URL=https://api.unitywallet.vn/copilot
BACKEND_API_URL=https://api.unitywallet.vn
COPILOT_API_KEY=prod-api-key-secure
```

## 🚀 Deployment

### Docker Deployment
```dockerfile
# Dockerfile for Financial Copilot API
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

EXPOSE 8001

CMD ["python", "-m", "src.agent.api_server"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  unity-wallet-backend:
    image: unity-wallet-backend:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://...
  
  financial-copilot:
    build: ./ml
    ports:
      - "8001:8001"
    environment:
      - BACKEND_URL=http://unity-wallet-backend:8000
      - API_KEY=${COPILOT_API_KEY}
    depends_on:
      - unity-wallet-backend
    volumes:
      - ./ml/models:/app/models
```

## 📊 Monitoring & Analytics

### Health Check
```bash
curl http://localhost:8001/health
```

### Model Performance
```bash
curl http://localhost:8001/api/v1/models
```

### Logs
```bash
# API logs
tail -f /var/log/financial-copilot/api.log

# Model performance logs  
tail -f /var/log/financial-copilot/models.log
```

## 🎯 Next Steps

1. **Test Integration**: Test với real backend APIs
2. **Performance Tuning**: Optimize response times
3. **Security**: Add authentication & rate limiting
4. **Monitoring**: Add logging và metrics
5. **Scaling**: Deploy với load balancer

Bạn cần tôi hỗ trợ implement phần nào cụ thể không? 🚀
