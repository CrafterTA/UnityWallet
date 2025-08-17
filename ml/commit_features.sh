#!/bin/bash

# Unity Wallet ML - Automated Commit Script
# Usage: ./commit_features.sh

set -e

echo "🚀 Starting automated commits for Unity Wallet ML features..."

# Ensure we're in the right directory
cd /home/thaianh/Workspace/UnityWallet

# Clean up temporary files
echo "🧹 Cleaning up temporary files..."
find . -name "*.pyc" -delete 2>/dev/null || true
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "*.log" -delete 2>/dev/null || true
find . -name "nohup.out" -delete 2>/dev/null || true

# Check git status
echo "📊 Current git status:"
git status --porcelain

echo ""
echo "🎯 Starting feature commits..."

# Commit 1: Infrastructure & Configuration
echo "Commit 1/10: 🏗️ ML Infrastructure & Configuration"
git add ml/src/config.py
git add ml/src/__init__.py
git add ml/src/models/__init__.py  
git add ml/src/rules/__init__.py
git add ml/src/api/__init__.py
git add ml/requirements.txt
git commit -m "feat: 🏗️ setup ML infrastructure and core configuration

- Add centralized ML configuration (config.py)
- Setup Python package structure with __init__.py files
- Define ML model parameters and paths
- Add Python dependencies for ML pipeline" 2>/dev/null || echo "⚠️ No changes for infrastructure"

# Commit 2: Data Pipeline & Seed Generation
echo "Commit 2/10: 📊 Data Pipeline & Seed Generation"
git add ml/data/seed/make_seed.py
git add ml/data/seed/personas.json
git add ml/data/seed/transactions.csv
git add ml/data/seed/credit_features.csv
git add ml/data/seed/anomaly_test_cases.csv
git commit -m "feat: 📊 implement data pipeline and synthetic data generation

- Create seed data generator with 3 Vietnamese personas
- Generate 1,833 realistic transactions for 18 users
- Add credit features and anomaly test cases
- Include Vietnamese merchant names and locations" 2>/dev/null || echo "⚠️ No changes for data pipeline"

# Commit 3: Spend Classification
echo "Commit 3/10: 🏷️ Spend Classification Model"
git add ml/src/models/spend_clf.py
git add ml/artifacts/models/spend_classifier.joblib 2>/dev/null || true
git add ml/artifacts/models/spend_classifier_metrics.json 2>/dev/null || true
git commit -m "feat: 🏷️ implement hybrid spend classification model

- Rule-based + ML approach with 100% rule coverage  
- TF-IDF + Logistic Regression for fallback
- Achieve F1-Score = 1.0 (target ≥0.85)
- Support 9 spending categories with Vietnamese keywords" 2>/dev/null || echo "⚠️ No changes for spend classification"

# Commit 4: Credit Scoring
echo "Commit 4/10: 💳 Credit Scoring System"
git add ml/src/models/credit_score.py
git add ml/artifacts/models/credit_score_model.joblib 2>/dev/null || true
git add ml/artifacts/models/credit_score_metrics.json 2>/dev/null || true
git commit -m "feat: 💳 implement credit scoring with probability calibration

- Logistic regression with 28 financial features
- Achieve ROC-AUC = 1.0 (target ≥0.75)
- Credit scores 300-850 with A/B/C/D grades
- Vietnamese reason codes for explainability" 2>/dev/null || echo "⚠️ No changes for credit scoring"

# Commit 5: Anomaly Detection
echo "Commit 5/10: 🚨 Anomaly Detection System"
git add ml/src/models/anomaly.py
git add ml/artifacts/models/anomaly_detector.joblib 2>/dev/null || true
git add ml/artifacts/models/anomaly_detector_metrics.json 2>/dev/null || true
git commit -m "feat: 🚨 implement multi-factor anomaly detection

- Rule-based detection: amount, velocity, location, category
- Achieve 91.7% accuracy with severity scoring
- Geographical analysis for Vietnamese cities
- Alert system with cooldown periods" 2>/dev/null || echo "⚠️ No changes for anomaly detection"

# Commit 6: Financial Insights
echo "Commit 6/10: 💡 Financial Insights Engine"
git add ml/src/rules/insights.py
git add ml/src/rules/mcc_map.py 2>/dev/null || true
git add ml/artifacts/dicts/mcc_mapping.json
git commit -m "feat: 💡 implement financial insights with business rules

- 7 insight rules for spending optimization
- Vietnamese partner integration (VietJet, Sovico, HDBank)
- MCC code mapping with 50+ categories
- Actionable financial recommendations" 2>/dev/null || echo "⚠️ No changes for insights engine"

# Commit 7: FastAPI Service
echo "Commit 7/10: 🌐 FastAPI Service & Endpoints"
git add ml/src/api/service.py
git commit -m "feat: 🌐 implement FastAPI service with ML endpoints

- 4 REST endpoints: spend, credit, alerts, insights
- Performance tracking and error handling
- Swagger documentation and health checks
- Async processing with 3.6ms average response time" 2>/dev/null || echo "⚠️ No changes for API service"

# Commit 8: Utilities
echo "Commit 8/10: 🛠️ Utilities & Helper Functions"
git add ml/src/utils/geo.py 2>/dev/null || true
git add ml/src/utils/io.py 2>/dev/null || true
git add ml/src/score.py 2>/dev/null || true
git add ml/src/features/ 2>/dev/null || true
git commit -m "feat: 🛠️ add utility functions and helper modules

- Geographical utilities for location analysis
- I/O helpers for data processing
- Score calculation utilities" 2>/dev/null || echo "⚠️ No changes for utilities"

# Commit 9: ML Agents & Pipelines
echo "Commit 9/10: 🤖 ML Agents & Pipeline Orchestration"
git add ml/src/agent/ 2>/dev/null || true
git add ml/src/pipelines/ 2>/dev/null || true
git commit -m "feat: 🤖 implement ML agents and training pipelines

- Agent system for ML workflow orchestration
- Training pipelines for automated model updates
- Data aggregation and feature computation" 2>/dev/null || echo "⚠️ No changes for agents/pipelines"

# Commit 10: Documentation
echo "Commit 10/10: 📚 Documentation & Project Management"
git add ml/README.md
git add ml/PROJECT_STATUS.md  
git add ml/TODO.md
git add ml/QUICK_REFERENCE.md
git add ml/COMMIT_STRATEGY.md
git commit -m "docs: 📚 add comprehensive documentation and project roadmap

- Complete technical documentation with architecture
- Project status tracking and KPI achievements  
- 4-week roadmap with detailed TODO lists
- Quick reference for deployment and troubleshooting
- Git commit strategy guide" 2>/dev/null || echo "⚠️ No changes for documentation"

echo ""
echo "✅ All commits completed!"
echo ""
echo "📊 Final git status:"
git status --porcelain

echo ""
echo "📈 Commit history (last 10):"
git log --oneline -10

echo ""
echo "🚀 Ready to push to remote:"
echo "   git push origin feature/ml-credit-score"
echo ""
echo "🎯 Total commits created for Unity Wallet ML features!"
