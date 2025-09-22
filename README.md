# 🌟 SoviPay - Digital Wallet Revolution

**SoviPay** is a modern digital wallet application built on Stellar blockchain that transforms loyalty points into digital assets and provides intelligent financial services.

## 🚀 Key Features

### 💳 Digital Asset Management
- Manage SkyPoints (SYP), XLM and USDC
- Intuitive and user-friendly interface
- Real-time balance tracking

### 📱 QR Code Payments
- Generate and scan QR codes for quick transactions
- Secure contactless payments
- Instant transaction verification

### 🔄 Asset Swapping
- Exchange assets through Stellar DEX
- Real-time quotes
- Transparent transaction fees

### 🤖 AI Assistant & Analytics
- Smart spending analysis
- Personalized financial recommendations
- Vietnamese-supported chatbot
- Internal credit scoring

### 🛡️ Anomaly Detection
- AI-powered suspicious transaction detection
- Protection against fraud
- Unusual activity alerts

## 🏗️ System Architecture

```
📱 Frontend (React + TypeScript)
    ↕️
⚡ Chain API (FastAPI + Python)
    ↕️
🧠 ML Service (Machine Learning)
    ↕️
⭐ Stellar Blockchain
```

### 🎨 Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** with custom design system
- **Zustand** for state management
- **TanStack Query** for data fetching

### ⚡ Chain API
- **FastAPI** for backend API
- **Stellar SDK** blockchain integration
- **Pydantic** for validation
- RESTful API design

### 🧠 ML Service
- **Scikit-learn** for machine learning
- **Pandas** for data processing
- **FastAPI** for ML endpoints
- Isolation Forest for anomaly detection

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | FastAPI, Python, Pydantic |
| ML | Scikit-learn, Pandas, NumPy |
| Blockchain | Stellar SDK, Horizon API |
| Database | File-based storage, JSON |
| Deployment | Docker, Linux |

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
└── 🧠 ml/              # Machine Learning service
    ├── services/        # ML algorithms
    ├── models/          # Data models
    └── artifacts/       # Trained models
```

## 🚀 Quick Start

### System Requirements
- Python 3.8+
- Node.js 18+
- Git

### 1. Clone repository
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

### 3. Run ML Service
```bash
cd ml
pip install -r requirements.txt
python main.py
```

### 4. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

The application will run at:
- Frontend: http://localhost:5173
- Chain API: http://localhost:8000
- ML Service: http://localhost:8001

## 🌐 API Documentation

### Chain API Endpoints
- `GET /wallet/{account_id}` - Get wallet information
- `POST /send` - Send payment
- `POST /swap` - Swap assets
- `GET /transactions/{account_id}` - Transaction history

### ML API Endpoints
- `POST /analytics/insights` - Financial analysis
- `POST /anomaly/detect` - Anomaly detection
- `POST /chatbot/ask` - Chatbot assistant

## 🤝 Contributing

We welcome all contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is distributed under the MIT License. See `LICENSE` for more information.

## 📧 Contact

- **Author**: CrafterTA
- **Email**: [hoangthaianh397@gmail.com]
- **Project Link**: [https://github.com/CrafterTA/UnityWallet](https://github.com/CrafterTA/UnityWallet)

---

<div align="center">
  <strong>🌟 If this project is helpful, please give us a star! ⭐</strong>
</div>
