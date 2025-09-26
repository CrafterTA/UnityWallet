# 🌟 SoviPay — Vietnam’s Intelligent Digital Wallet

SoviPay is Vietnam's intelligent digital wallet that combines AI-powered financial assistance with Solana blockchain technology. Built on the Solana network, our platform enables secure multi-asset management with Vietnamese Financial AI providing real-time anomaly detection in transactions, personalized spending analysis, and natural language financial insights.

The platform features:
- Automated trustline management
- Solana DEX integration
- Integration into Sovico’s ecosystem and loyalty points
- Expanded payment utilities and diversified financial, travel, and consumer services

---

## 🚀 Key Features

### 🔒 Secure Multi-Asset Management
- Manage SOL, and Sovico loyalty points
- Automated trustline creation and management
- Real-time asset tracking

### 🤖 Vietnamese Financial AI
- Personalized spending analysis and recommendations
- Natural language chatbot for financial insights (Vietnamese supported)
- AI-powered anomaly detection for transaction security

### 🔗 Solana DEX Integration
- Swap tokens instantly via Solana DEX
- Transparent quotes and transaction fees

### 🛡️ Real-Time Fraud & Anomaly Detection
- AI monitors transactions for unusual behavior
- Alerts for suspicious activity

### 🏆 Sovico Ecosystem Loyalty
- Seamless management and conversion of Sovico loyalty points
- Expandable to airline, hospitality, and consumer services,...

### 🌏 Diverse Payment & Service Utilities
- Fast QR payments and bill splitting
- Integration for travel, finance, and consumer experiences

---

## 🏗️ System Architecture

```
📱 Frontend (React + TypeScript)
    ↕️
⚡ Chain API (FastAPI + Python)
    ↕️
🧠 Financial AI/ML Service
    ↕️
⭐ Solana Blockchain
```

---

## 🛠️ Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Frontend   | React, TypeScript, Vite, Tailwind CSS       |
| Backend    | FastAPI, Python, Pydantic                   |
| ML         | Scikit-learn, Pandas, NumPy                 |
| Blockchain | Solana Web3.js, Solana DEX, Solana API      |
| Database   | File-based storage, JSON                    |
| Deployment | Docker, Linux                               |

---

## 📁 Project Structure

```
📦 SoviPay/
├── 📱 frontend/          # React frontend application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # App pages
│   │   ├── api/          # API clients
│   │   └── store/        # State management
├── ⚡ chain/            # Blockchain API service
│   ├── routers/         # API endpoints
│   ├── services/        # Business logic
│   └── models/          # Data schemas
└── 🧠 ml/              # Financial AI/ML service
    ├── services/        # ML algorithms
    ├── models/          # Data models
    └── artifacts/       # Trained models
```

---

## 🚀 Quick Start

### System Requirements
- Python 3.8+
- Node.js 18+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/CrafterTA/UnityWallet.git
cd UnityWallet
```

### 2. Run Chain API
```bash
cd chain
pip install -r requirements.txt
python main.py
```

---

> Learn more and contribute: [CrafterTA/UnityWallet on GitHub](https://github.com/CrafterTA/UnityWallet)
