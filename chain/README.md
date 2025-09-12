chain/
  ├── core/          # Core configuration
  │   └── config.py
  ├── models/        # Data models
  │   └── schemas.py
  ├── services/      # Business logic
  │   ├── stellar.py
  │   ├── mnemonic.py
  │   ├── trust.py
  │   ├── payments.py
  │   ├── swap.py
  │   └── amm.py
  ├── routers/       # API endpoints
  │   ├── wallet.py
  │   ├── onboard.py
  │   ├── trustline.py
  │   ├── send.py
  │   ├── swap.py
  │   └── tx.py
  ├── main.py
  ├── requirements.txt
  └── .env
