# Unity Wallet

A comprehensive fintech platform featuring Stellar network integration, multi-currency wallet management, ML-powered analytics, and enterprise-grade compliance features.

## 🏗️ Architecture

Unity Wallet consists of two main components:

### Backend (FastAPI)
- **Location**: `/backend/`
- **Tech Stack**: FastAPI, PostgreSQL, Redis, Stellar SDK, ML Models
- **Features**: Authentication, wallet management, payments, loyalty system, ML-powered analytics

### ML Module (Integrated)
- **Location**: `/backend/app/analytics_svc/ml_models/`
- **Models**: Credit scoring, transaction classification, anomaly detection
- **Languages**: Vietnamese localization support

## 🚀 Features

### Core Fintech Features
- ✅ **JWT Authentication** - Secure login with bcrypt password hashing
- ✅ **Multi-Currency Wallet** - Support for SYP and USD assets
- ✅ **Stellar Integration** - Testnet transactions with dry-run capability
- ✅ **1:1 Currency Swaps** - Real-time SYP ↔ USD conversions
- ✅ **QR Code Payments** - Generate and process QR payment codes
- ✅ **Loyalty Points** - Earn and burn SYP reward points

### ML-Powered Analytics
- 🤖 **Credit Scoring** - ML-based credit assessment with Vietnamese reason codes
- 🤖 **Transaction Classification** - Hybrid rule-based + TF-IDF categorization
- 🤖 **Anomaly Detection** - Rule-based spending pattern analysis
- 🤖 **User Insights** - AI-generated spending analytics and recommendations
- 🤖 **Real-time Alerts** - ML-enhanced transaction monitoring

### Enterprise Features
- 🔒 **Security** - Rate limiting, correlation ID tracking, input validation
- 🗄️ **Database** - PostgreSQL with UUID primary keys and proper relationships
- 📊 **Caching** - Redis for sessions, rate limiting, and idempotency
- 📝 **Compliance** - Append-only audit logging, idempotency protection
- 🐳 **Containerization** - Full Docker Compose setup
- 🧪 **Testing** - Comprehensive E2E and compliance test suites

## 📋 Requirements

- Docker & Docker Compose
- Python 3.11+ (for local development)
- PostgreSQL 15+
- Redis 7+

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd UnityWallet
```

### 2. Start Backend Services
```bash
cd backend
docker compose up -d
```

### 3. Initialize Database
```bash
docker compose exec api python seed.py
```

### 4. Access Services
- **API Documentation**: http://localhost:8001/docs
- **Health Check**: http://localhost:8001/healthz
- **Readiness Check**: http://localhost:8001/readyz

## 🔑 API Authentication

### Test Users
| Username | Password | KYC Status | SYP Balance | USD Balance |
|----------|----------|------------|-------------|-------------|
| alice    | password123 | VERIFIED   | 1000.0      | 200.0       |
| bob      | password123 | VERIFIED   | 1000.0      | 200.0       |
| carol    | password123 | PENDING    | 1000.0      | 200.0       |

### Login Example
```bash
curl -X POST "http://localhost:8001/auth/login?username=alice&password=password123"
```

## 🛠️ API Endpoints

### Core Services
- **Authentication**: `/auth/login`, `/auth/me`
- **Wallet**: `/wallet/balances`, `/wallet/payment`, `/wallet/swap`
- **QR Payments**: `/qr/create`, `/qr/pay`
- **Loyalty**: `/loyalty/points`, `/loyalty/earn`, `/loyalty/burn`

### ML Analytics Endpoints
- **Insights**: `/analytics/insights` - ML-powered spending insights
- **Credit Score**: `/analytics/credit-score` - Basic credit score
- **Detailed Credit**: `/analytics/credit-score/detailed` - Score with reason codes
- **Classification**: `/analytics/classify` - Classify single transaction
- **Batch Classification**: `/analytics/classify-batch` - Classify multiple transactions
- **Anomaly Detection**: `/analytics/anomalies` - Detect spending anomalies

## 🧪 Testing

```bash
cd backend

# Run all tests
.venv/bin/python -m pytest -v

# Run E2E tests (includes ML endpoints)
.venv/bin/python -m pytest test/test_backend_e2e.py -v

# Run compliance tests
.venv/bin/python -m pytest test/test_audit.py test/test_idempotency.py -v
```

**Test Results**: ✅ 66/66 tests passing (100% success rate)

## 🤖 ML Features

### Credit Scoring Model
- **Algorithm**: Logistic regression with probability calibration
- **Features**: 28+ behavioral features from transaction history
- **Localization**: Vietnamese reason codes
- **Fallback**: Heuristic scoring when model unavailable

### Transaction Classification
- **Approach**: Hybrid rule-based + TF-IDF machine learning
- **Categories**: F&B, Shopping, Transportation, Banking, etc.
- **Languages**: Vietnamese text processing with unidecode
- **Accuracy**: High confidence rule-based, ML fallback

### Anomaly Detection
- **Method**: Rule-based pattern analysis
- **Detection**: Amount outliers, frequency anomalies, location changes
- **Thresholds**: Configurable Z-score and time-based limits
- **Real-time**: Integrated with transaction processing

## 🔒 Security & Compliance

### Enterprise Compliance (7/7 Gates Complete)
- ✅ **JWT Authentication** - HS256 with configurable expiration
- ✅ **Database Migrations** - Alembic versioning at `head`
- ✅ **Idempotency Protection** - All side-effects protected
- ✅ **Health Monitoring** - `/healthz` and `/readyz` endpoints
- ✅ **Audit Logging** - Append-only compliance trail
- ✅ **Request Tracking** - Correlation IDs across services
- ✅ **Security Pipeline** - Automated scanning in CI/CD

### Idempotency Example
```bash
curl -X POST "http://localhost:8001/wallet/swap" \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: unique-swap-123" \
  -H "Content-Type: application/json" \
  -d '{"sell_asset": "SYP", "buy_asset": "USD", "amount": 100.0}'
```

## 🌟 Stellar Blockchain Integration

- **Network**: Testnet with mainnet-ready architecture
- **Features**: Payment operations, asset swaps, transaction tracking
- **Safety**: Dry-run mode for testing
- **Resilience**: Multi-endpoint failover with retry logic

## 📊 Database Schema

PostgreSQL with UUID primary keys:
- **users** - User accounts with KYC status
- **accounts** - Stellar wallet addresses per asset  
- **balances** - Current asset balances
- **transactions** - Payment and swap history
- **loyalty_points** - SYP rewards balance
- **credit_score** - ML-generated credit ratings
- **audit_logs** - Compliance audit trail

## 🔧 Configuration

### Environment Variables
```bash
# Database
POSTGRES_HOST=localhost
POSTGRES_DB=unity_wallet
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Authentication
JWT_SECRET_KEY=(generate secure key for production)

# Stellar
STELLAR_NETWORK=testnet
STELLAR_DRY_RUN=true

# Redis
REDIS_URL=redis://localhost:6379/0

# API
RATE_LIMIT_PER_MINUTE=60
LOG_LEVEL=INFO
```

### ML Dependencies
The ML features require additional packages (automatically installed in Docker):
```txt
pandas>=2.0
numpy>=1.20
scikit-learn>=1.3
scipy>=1.10
joblib>=1.3
unidecode>=1.3
geopy>=2.3
```

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Generate secure `JWT_SECRET_KEY`
- [ ] Change all default passwords
- [ ] Set `STELLAR_DRY_RUN=false` for live transactions
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS termination
- [ ] Enable monitoring and log aggregation
- [ ] Verify ML model artifacts are available

### Docker Deployment
```bash
# Build production image
docker build -t unity-wallet-backend ./backend

# Run with production environment
docker run -p 8000:8000 --env-file .env.prod unity-wallet-backend
```

## 🐛 Troubleshooting

### Common Issues

**ML Models Not Working:**
```bash
# Check ML dependencies
.venv/bin/python -c "import pandas, numpy, sklearn; print('ML dependencies OK')"

# ML models will use fallback behavior if not trained
```

**Authentication Fails:**
```bash
docker compose exec api python seed.py
```

**Database Connection Error:**
```bash
docker compose logs db
```

### Health Checks
```bash
# Basic health
curl http://localhost:8001/healthz

# Full readiness (DB, Redis, Horizon, ML)
curl http://localhost:8001/readyz
```

## 📁 Project Structure

```
UnityWallet/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── analytics_svc/     # ML-powered analytics
│   │   │   ├── ml_models/     # ML models (credit, classification, anomaly)
│   │   │   ├── router.py      # Analytics + ML endpoints
│   │   │   ├── service.py     # ML integration logic
│   │   │   └── schema.py      # ML request/response models
│   │   ├── auth_svc/          # JWT authentication
│   │   ├── wallet_svc/        # Wallet operations
│   │   ├── payments_svc/      # Stellar payments
│   │   ├── loyalty_svc/       # Loyalty points
│   │   ├── qr_svc/           # QR payments
│   │   ├── common/           # Shared utilities
│   │   └── main.py           # FastAPI app
│   ├── test/                 # Test suites
│   ├── alembic/             # Database migrations
│   ├── requirements.txt     # Python dependencies (includes ML)
│   └── docker-compose.yml   # Development environment
├── CLAUDE.md               # Development guide
└── README.md              # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `.venv/bin/python -m pytest -v`
5. Submit a pull request

## 📄 License

Unity Wallet - Comprehensive fintech platform with ML-powered analytics.

---

**Built with**: FastAPI, PostgreSQL, Redis, Stellar SDK, scikit-learn, and enterprise-grade security.