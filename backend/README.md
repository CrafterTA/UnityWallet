# Unity Wallet Backend

A comprehensive fintech backend system built with FastAPI, featuring Stellar network integration, multi-currency wallet management, and microservices architecture.

## 🏗️ Architecture

The Unity Wallet backend follows a microservices pattern with the following services:

- **Auth Service** - JWT authentication with real password hashing
- **Wallet Service** - Balance management, payments, and currency swaps
- **Payments Service** - QR code payments with idempotency support
- **Loyalty Service** - SYP points earning and burning system
- **Analytics Service** - User insights, credit scoring, and alerts
- **QR Service** - QR code generation and payment processing

## 🚀 Features

### Core Features
- ✅ **JWT Authentication** - Secure login with bcrypt password hashing
- ✅ **Multi-Currency Wallet** - Support for SYP and USD assets
- ✅ **Stellar Integration** - Testnet transactions with dry-run capability
- ✅ **1:1 Currency Swaps** - Real-time SYP ↔ USD conversions
- ✅ **QR Code Payments** - Generate and process QR payment codes
- ✅ **Loyalty Points** - Earn and burn SYP reward points
- ✅ **User Analytics** - Spending insights and credit scoring
- ✅ **Real-time Alerts** - Transaction and system notifications

### Technical Features
- 🔒 **Security** - Rate limiting, correlation ID tracking, input validation
- 🗄️ **Database** - PostgreSQL with UUID primary keys and proper relationships
- 📊 **Caching** - Redis for sessions, rate limiting, and idempotency
- 📝 **Logging** - Structured JSON logging with correlation tracking
- 🐳 **Containerization** - Full Docker Compose setup
- 🧪 **Testing** - Comprehensive E2E test suite

## 📋 Requirements

- Docker & Docker Compose
- Python 3.11+ (for local development)
- PostgreSQL 15+
- Redis 7+

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd backend
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services
```bash
docker compose up -d
```

### 4. Initialize Database
```bash
docker compose exec api python seed.py
```

### 5. Access API
- **API Base URL**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **Health Check**: http://localhost:8001/

## 🔑 API Authentication

### Login
```bash
curl -X POST "http://localhost:8001/auth/login?username=alice&password=password123"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Using JWT Token
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/wallet/balances
```

## 📊 Test Users

The system comes pre-seeded with test users:

| Username | Password | KYC Status | SYP Balance | USD Balance |
|----------|----------|------------|-------------|-------------|
| alice    | password123 | VERIFIED   | 1000.0      | 200.0       |
| bob      | password123 | VERIFIED   | 1000.0      | 200.0       |
| carol    | password123 | PENDING    | 1000.0      | 200.0       |

## 🛠️ API Endpoints

### Authentication
- `POST /auth/login` - User authentication
- `GET /auth/me` - Get current user profile

### Wallet Management
- `GET /wallet/balances` - Get user balances
- `POST /wallet/payment` - Send payments
- `POST /wallet/swap` - Currency swaps (1:1 SYP ↔ USD)

### QR Payments
- `POST /qr/create` - Generate payment QR code
- `POST /qr/pay` - Process QR payment (with idempotency)

### Loyalty System
- `GET /loyalty/points` - Get loyalty points balance
- `POST /loyalty/earn` - Earn loyalty points
- `POST /loyalty/burn` - Redeem loyalty points
- `GET /loyalty/offers` - Get available offers

### Analytics
- `GET /analytics/spend` - Spending analytics
- `GET /analytics/insights` - User insights
- `GET /analytics/credit-score` - Credit score
- `GET /analytics/alerts` - User alerts

## 🧪 Testing

### Run E2E Tests
```bash
# Use existing virtual environment
source .venv/bin/activate
.venv/bin/python -m pytest test/test_backend_e2e.py -v
```

### Test Results
- ✅ **9/9 tests passing** (100% success rate)
- ✅ Authentication & JWT tokens
- ✅ Wallet operations & balance management
- ✅ Currency swaps & payment processing
- ✅ Loyalty points system
- ✅ Analytics & insights
- ✅ Security & rate limiting
- ✅ QR payments with idempotency

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_HOST` | localhost | Database host |
| `POSTGRES_DB` | unity_wallet | Database name |
| `POSTGRES_USER` | postgres | Database user |
| `POSTGRES_PASSWORD` | password | Database password |
| `REDIS_URL` | redis://localhost:6379/0 | Redis connection |
| `JWT_SECRET_KEY` | (change in production) | JWT signing key |
| `STELLAR_NETWORK` | testnet | Stellar network (testnet/mainnet) |
| `STELLAR_DRY_RUN` | true | Enable dry-run mode |
| `RATE_LIMIT_PER_MINUTE` | 60 | API rate limit |
| `LOG_LEVEL` | INFO | Logging level |

### Docker Services

```yaml
services:
  api:        # FastAPI application (port 8001)
  db:         # PostgreSQL database (port 5432)
  redis:      # Redis cache (port 6379)
```

## 💾 Database Schema

The system uses PostgreSQL with UUID primary keys:

- **users** - User accounts with KYC status
- **accounts** - Stellar wallet addresses per asset
- **balances** - Current asset balances
- **transactions** - Payment and swap history
- **loyalty_points** - SYP rewards balance
- **offers** - Available loyalty offers
- **credit_score** - User credit ratings
- **alerts** - System notifications

## 🌟 Stellar Integration

The backend integrates with Stellar testnet for blockchain operations:

- **Dry-run Mode** - Safe testing without real transactions
- **Payment Operations** - Send payments between accounts
- **Asset Support** - Custom SYP tokens and USD anchors
- **Transaction Tracking** - Full XDR and hash logging

## 🔒 Security Features

- **JWT Authentication** - HS256 algorithm with configurable expiration
- **Password Hashing** - bcrypt with proper verification
- **Rate Limiting** - Per-minute and hourly request limits
- **Input Validation** - Pydantic schemas for all endpoints
- **Correlation IDs** - Request tracking across services
- **CORS Protection** - Configurable cross-origin policies

## 🐛 Troubleshooting

### Common Issues

**Authentication Fails:**
```bash
# Check if database is seeded
docker compose exec api python seed.py
```

**Database Connection Error:**
```bash
# Check database service
docker compose logs db
```

**Redis Connection Error:**
```bash
# Check Redis service
docker compose logs redis
```

### Logs
```bash
# View all service logs
docker compose logs -f

# View API logs only
docker compose logs -f api
```

## 🚀 Deployment

### Production Checklist
- [ ] **CRITICAL**: Generate secure JWT_SECRET_KEY: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- [ ] **CRITICAL**: Change all default passwords (database, Redis, etc.)
- [ ] **CRITICAL**: Update existing user passwords with bcrypt hashing
- [ ] Configure proper CORS origins (remove localhost)
- [ ] Set STELLAR_DRY_RUN=false for real transactions
- [ ] Set up SSL/TLS termination
- [ ] Configure log aggregation (avoid logging sensitive data)
- [ ] Set up monitoring and alerts
- [ ] Enable database SSL connections
- [ ] Implement API versioning
- [ ] Add request/response logging with sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pytest test/test_backend_e2e.py -v`
5. Submit a pull request

## 📄 License

This project is part of the Unity Wallet fintech demonstration system.

---

**Unity Wallet Backend** - Built with FastAPI, PostgreSQL, Redis, and Stellar SDK