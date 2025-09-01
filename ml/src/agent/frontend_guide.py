"""
Frontend Integration Guide for Financial Copilot
React/Vue.js components for chat interface and widgets
"""

# React Components Example

CHAT_INTERFACE_REACT = """
// FinancialCopilot.jsx - Main chat component
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FinancialCopilot = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick suggestion buttons
  const quickSuggestions = [
    "Tóm tắt chi tiêu tháng này",
    "Có giao dịch bất thường nào không?", 
    "Gợi ý tiết kiệm 15% cho tôi",
    "Phân tích danh mục chi tiêu"
  ];

  const sendMessage = async (message) => {
    setLoading(true);
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    try {
      const response = await axios.post('/api/copilot/chat', {
        message: message,
        user_id: userId
      });
      
      // Add AI response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.response,
        actions: response.data.actions,
        insights: response.data.ml_insights
      }]);
      
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Xin lỗi, tôi không thể xử lý yêu cầu này.' 
      }]);
    }
    
    setLoading(false);
    setInput('');
  };

  return (
    <div className="financial-copilot">
      {/* Chat Header */}
      <div className="chat-header">
        <h3>🤖 Trợ lý Tài chính AI</h3>
        <p>Hỏi tôi về chi tiêu, tiết kiệm, hoặc phát hiện gian lận</p>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content}
            </div>
            
            {/* Action buttons for AI responses */}
            {msg.actions && msg.actions.map((action, actionIdx) => (
              <button 
                key={actionIdx}
                className={`action-btn ${action.type}`}
                onClick={() => handleAction(action)}
              >
                {action.title}
              </button>
            ))}
          </div>
        ))}
        
        {loading && <div className="loading">Đang phân tích...</div>}
      </div>

      {/* Quick Suggestions */}
      <div className="quick-suggestions">
        {quickSuggestions.map((suggestion, idx) => (
          <button 
            key={idx}
            onClick={() => sendMessage(suggestion)}
            className="suggestion-btn"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Hỏi về tài chính của bạn..."
        />
        <button onClick={() => sendMessage(input)}>Gửi</button>
      </div>
    </div>
  );
};

// SpendingChart.jsx - Biểu đồ danh mục
const SpendingChart = ({ userId }) => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchSpendingData();
  }, [userId]);
  
  const fetchSpendingData = async () => {
    try {
      const response = await axios.get(`/api/copilot/quick-insights/${userId}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching spending data:', error);
    }
  };

  return (
    <div className="spending-chart">
      <h4>📊 Phân loại chi tiêu tháng này</h4>
      
      {data && (
        <>
          {/* Pie chart for categories */}
          <div className="category-chart">
            {Object.entries(data.categories).map(([category, amount]) => (
              <div key={category} className="category-item">
                <span className="category-name">{category}</span>
                <span className="category-amount">
                  {amount.toLocaleString('vi-VN')} VND
                </span>
              </div>
            ))}
          </div>
          
          {/* Trend indicators */}
          <div className="trend-indicators">
            <div className="trend-item">
              <span>Tổng chi tiêu:</span>
              <span>{data.trends.total_spending.toLocaleString('vi-VN')} VND</span>
            </div>
            <div className="trend-item">
              <span>Số giao dịch:</span>
              <span>{data.trends.transaction_count}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// FraudAlert.jsx - Cảnh báo gian lận
const FraudAlert = ({ userId }) => {
  const [alert, setAlert] = useState(null);
  
  const checkFraud = async () => {
    try {
      const response = await axios.post('/api/copilot/fraud-alert', {
        user_id: userId,
        transaction_id: 'latest'
      });
      
      if (response.data.alert) {
        setAlert(response.data);
      }
    } catch (error) {
      console.error('Fraud check error:', error);
    }
  };
  
  const handleAction = async (action) => {
    switch (action.action) {
      case 'lock_card':
        // Call card locking API
        await lockCard();
        break;
      case 'verify_transaction':
        // Show verification modal
        showVerificationModal();
        break;
      case 'contact_support':
        // Open support chat
        openSupportChat();
        break;
    }
  };

  return (
    <>
      {alert && (
        <div className="fraud-alert">
          <div className="alert-header">
            <h4>⚠️ Cảnh báo gian lận</h4>
            <span className={`risk-level ${alert.risk_level}`}>
              {alert.risk_level.toUpperCase()}
            </span>
          </div>
          
          <div className="alert-content">
            <p>Phát hiện giao dịch bất thường:</p>
            <ul>
              {alert.reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
          
          <div className="alert-actions">
            {alert.suggested_actions.map((action, idx) => (
              <button
                key={idx}
                className={`alert-action ${action.type}`}
                onClick={() => handleAction(action)}
              >
                {action.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export { FinancialCopilot, SpendingChart, FraudAlert };
"""

# Vue.js Components Example  
CHAT_INTERFACE_VUE = """
<!-- FinancialCopilot.vue -->
<template>
  <div class="financial-copilot">
    <!-- Chat Interface -->
    <div class="chat-container">
      <div class="chat-header">
        <h3>🤖 Trợ lý Tài chính AI</h3>
      </div>
      
      <div class="chat-messages" ref="messagesContainer">
        <div 
          v-for="(message, index) in messages" 
          :key="index"
          :class="['message', message.role]"
        >
          <div class="message-content">{{ message.content }}</div>
          
          <!-- Action buttons -->
          <div v-if="message.actions" class="message-actions">
            <button
              v-for="(action, actionIndex) in message.actions"
              :key="actionIndex"
              :class="['action-btn', action.type]"
              @click="handleAction(action)"
            >
              {{ action.title }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Quick suggestions -->
      <div class="quick-suggestions">
        <button
          v-for="(suggestion, index) in quickSuggestions"
          :key="index"
          @click="sendMessage(suggestion)"
          class="suggestion-btn"
        >
          {{ suggestion }}
        </button>
      </div>
      
      <!-- Input area -->
      <div class="chat-input">
        <input
          v-model="inputMessage"
          @keyup.enter="sendMessage(inputMessage)"
          placeholder="Hỏi về tài chính của bạn..."
          :disabled="loading"
        />
        <button @click="sendMessage(inputMessage)" :disabled="loading">
          {{ loading ? 'Đang xử lý...' : 'Gửi' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

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
      messages: [
        {
          role: 'assistant',
          content: 'Xin chào! Tôi là trợ lý tài chính AI. Bạn muốn hỏi gì về chi tiêu hay tiết kiệm?'
        }
      ],
      inputMessage: '',
      loading: false,
      quickSuggestions: [
        'Tóm tắt chi tiêu tháng này',
        'Có giao dịch bất thường nào không?',
        'Gợi ý tiết kiệm 15% cho tôi',
        'Phân tích danh mục chi tiêu'
      ]
    };
  },
  methods: {
    async sendMessage(message) {
      if (!message.trim()) return;
      
      this.loading = true;
      
      // Add user message
      this.messages.push({
        role: 'user',
        content: message
      });
      
      try {
        const response = await axios.post('/api/copilot/chat', {
          message: message,
          user_id: this.userId
        });
        
        // Add AI response
        this.messages.push({
          role: 'assistant',
          content: response.data.response,
          actions: response.data.actions,
          insights: response.data.ml_insights
        });
        
      } catch (error) {
        this.messages.push({
          role: 'assistant',
          content: 'Xin lỗi, tôi không thể xử lý yêu cầu này lúc này.'
        });
      }
      
      this.loading = false;
      this.inputMessage = '';
      this.scrollToBottom();
    },
    
    handleAction(action) {
      switch (action.action) {
        case 'lock_card':
          this.lockCard();
          break;
        case 'view_spending_report':
          this.$router.push('/spending-report');
          break;
        case 'verify_transaction':
          this.showVerificationModal();
          break;
      }
    },
    
    async lockCard() {
      // Implement card locking
      this.$emit('card-lock-requested');
    },
    
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        container.scrollTop = container.scrollHeight;
      });
    }
  }
};
</script>
"""

# CSS Styles
CHAT_STYLES = """
/* Financial Copilot Styles */
.financial-copilot {
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
}

.chat-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.chat-messages {
  height: 400px;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.message {
  margin-bottom: 15px;
  max-width: 80%;
}

.message.user {
  margin-left: auto;
}

.message.user .message-content {
  background: #007bff;
  color: white;
  border-radius: 18px 18px 4px 18px;
}

.message.assistant .message-content {
  background: white;
  color: #333;
  border-radius: 18px 18px 18px 4px;
  border: 1px solid #e0e0e0;
}

.message-content {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.4;
}

.message-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.security {
  background: #dc3545;
  color: white;
}

.action-btn.savings {
  background: #28a745;
  color: white;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.quick-suggestions {
  padding: 15px;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn {
  padding: 8px 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-btn:hover {
  background: #e0e0e0;
}

.chat-input {
  display: flex;
  padding: 15px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.chat-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 20px;
  outline: none;
  margin-right: 10px;
}

.chat-input button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

/* Fraud Alert Styles */
.fraud-alert {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 16px;
  margin: 16px;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.risk-level {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.risk-level.high {
  background: #dc3545;
  color: white;
}

.risk-level.medium {
  background: #ffc107;
  color: black;
}

.alert-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.alert-action {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.alert-action.security {
  background: #dc3545;
  color: white;
}

.alert-action.verification {
  background: #17a2b8;
  color: white;
}

/* Spending Chart Styles */
.spending-chart {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.category-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.category-name {
  font-weight: 500;
}

.category-amount {
  color: #007bff;
  font-weight: 600;
}

.trend-indicators {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.trend-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
"""

def create_frontend_guide():
    """Create complete frontend integration guide"""
    
    guide = f"""
# 🚀 Financial Copilot - Frontend Integration Guide

## Architecture Overview
```
Frontend (React/Vue) ↔ FastAPI Router ↔ Financial Copilot ↔ ML Models
                                                          ↔ LLM (OpenAI)
```

## Key Features Integration:

### 1. Chat Interface
{CHAT_INTERFACE_REACT}

### 2. Vue.js Implementation  
{CHAT_INTERFACE_VUE}

### 3. Styling
{CHAT_STYLES}

## API Endpoints Usage:

### Chat with AI
```javascript
// Send message to AI
const response = await fetch('/api/copilot/chat', {{
  method: 'POST',
  headers: {{ 'Content-Type': 'application/json' }},
  body: JSON.stringify({{
    message: "Tóm tắt chi tiêu tháng này",
    user_id: "user123"
  }})
}});

const data = await response.json();
// data.response: AI response text
// data.actions: Suggested actions
// data.ml_insights: ML analysis data
```

### Get Quick Insights
```javascript
// Get spending breakdown
const insights = await fetch('/api/copilot/quick-insights/user123');
const data = await insights.json();
// data.categories: Spending by category
// data.trends: Monthly trends
```

### Fraud Alert Check
```javascript
// Check for fraud
const fraudCheck = await fetch('/api/copilot/fraud-alert', {{
  method: 'POST',
  body: JSON.stringify({{
    user_id: "user123",
    transaction_id: "latest"
  }})
}});

const alert = await fraudCheck.json();
if (alert.alert) {{
  // Show fraud alert UI
  showFraudAlert(alert);
}}
```

## Mobile App Integration:

### React Native Components
```javascript
import {{ FinancialCopilot }} from './components/FinancialCopilot';

const WalletScreen = () => {{
  return (
    <View>
      <FinancialCopilot userId={{currentUser.id}} />
      <SpendingChart userId={{currentUser.id}} />
      <FraudAlert userId={{currentUser.id}} />
    </View>
  );
}};
```

## Real-time Features:

### WebSocket for Live Updates
```javascript
const ws = new WebSocket('ws://localhost:8000/copilot/live');

ws.onmessage = (event) => {{
  const update = JSON.parse(event.data);
  
  if (update.type === 'fraud_alert') {{
    showInstantFraudAlert(update.data);
  }}
  
  if (update.type === 'spending_update') {{
    updateSpendingChart(update.data);
  }}
}};
```

## Testing Examples:

```javascript
// Test conversations
const testMessages = [
  "Tóm tắt chi tiêu tháng này",
  "Có giao dịch bất thường nào không?",
  "Gợi ý tiết kiệm 15% khi bay",
  "Phân tích danh mục chi tiêu của tôi",
  "Điểm tín dụng của tôi như thế nào?"
];

testMessages.forEach(async (message) => {{
  const response = await sendChatMessage(message);
  console.log('Q:', message);
  console.log('A:', response.response);
  console.log('Actions:', response.actions);
}});
```
"""
    
    return guide

if __name__ == "__main__":
    guide = create_frontend_guide()
    print(guide)
