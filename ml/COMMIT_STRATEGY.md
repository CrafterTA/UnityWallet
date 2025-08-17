# Unity Wallet ML - Git Commit Strategy

## 🎯 Chiến lược chia commits theo features

### **Commit 1: 🏗️ ML Infrastructure & Configuration**
```bash
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
- Add Python dependencies for ML pipeline"
```

### **Commit 2: 📊 Data Pipeline & Seed Generation**  
```bash
git add ml/data/seed/make_seed.py
git add ml/data/seed/personas.json
git add ml/data/seed/transactions.csv
git add ml/data/seed/credit_features.csv
git add ml/data/seed/anomaly_test_cases.csv
git commit -m "feat: 📊 implement data pipeline and synthetic data generation

- Create seed data generator with 3 Vietnamese personas
- Generate 1,833 realistic transactions for 18 users
- Add credit features and anomaly test cases
- Include Vietnamese merchant names and locations"
```

### **Commit 3: 🏷️ Spend Classification Model**
```bash
git add ml/src/models/spend_clf.py
git add ml/artifacts/models/spend_classifier.joblib
git add ml/artifacts/models/spend_classifier_metrics.json
git commit -m "feat: 🏷️ implement hybrid spend classification model

- Rule-based + ML approach with 100% rule coverage  
- TF-IDF + Logistic Regression for fallback
- Achieve F1-Score = 1.0 (target ≥0.85)
- Support 9 spending categories with Vietnamese keywords"
```

### **Commit 4: 💳 Credit Scoring System**
```bash
git add ml/src/models/credit_score.py
git add ml/artifacts/models/credit_score_model.joblib
git add ml/artifacts/models/credit_score_metrics.json
git commit -m "feat: 💳 implement credit scoring with probability calibration

- Logistic regression with 28 financial features
- Achieve ROC-AUC = 1.0 (target ≥0.75)
- Credit scores 300-850 with A/B/C/D grades
- Vietnamese reason codes for explainability"
```

### **Commit 5: 🚨 Anomaly Detection System**
```bash
git add ml/src/models/anomaly.py
git add ml/artifacts/models/anomaly_detector.joblib  
git add ml/artifacts/models/anomaly_detector_metrics.json
git commit -m "feat: 🚨 implement multi-factor anomaly detection

- Rule-based detection: amount, velocity, location, category
- Achieve 91.7% accuracy with severity scoring
- Geographical analysis for Vietnamese cities
- Alert system with cooldown periods"
```

### **Commit 6: 💡 Financial Insights Engine**
```bash
git add ml/src/rules/insights.py
git add ml/src/rules/mcc_map.py
git add ml/artifacts/dicts/mcc_mapping.json
git commit -m "feat: 💡 implement financial insights with business rules

- 7 insight rules for spending optimization
- Vietnamese partner integration (VietJet, Sovico, HDBank)
- MCC code mapping with 50+ categories
- Actionable financial recommendations"
```

### **Commit 7: 🌐 FastAPI Service & Endpoints**
```bash
git add ml/src/api/service.py
git commit -m "feat: 🌐 implement FastAPI service with ML endpoints

- 4 REST endpoints: spend, credit, alerts, insights
- Performance tracking and error handling
- Swagger documentation and health checks
- Async processing with 3.6ms average response time"
```

### **Commit 8: 🛠️ Utilities & Helper Functions**
```bash
git add ml/src/utils/geo.py
git add ml/src/utils/io.py
git add ml/src/score.py
git commit -m "feat: 🛠️ add utility functions and helper modules

- Geographical utilities for location analysis
- I/O helpers for data processing
- Score calculation utilities"
```

### **Commit 9: 🤖 ML Agents & Pipeline Orchestration**
```bash
git add ml/src/agent/ask.py
git add ml/src/agent/router.py
git add ml/src/pipelines/train_credit.py
git add ml/src/pipelines/train_spend.py
git add ml/src/pipelines/compute_aggregates.py
git commit -m "feat: 🤖 implement ML agents and training pipelines

- Agent system for ML workflow orchestration
- Training pipelines for automated model updates
- Data aggregation and feature computation"
```

### **Commit 10: 📚 Documentation & Project Management**
```bash
git add ml/README.md
git add ml/PROJECT_STATUS.md  
git add ml/TODO.md
git add ml/QUICK_REFERENCE.md
git commit -m "docs: 📚 add comprehensive documentation and project roadmap

- Complete technical documentation with architecture
- Project status tracking and KPI achievements  
- 4-week roadmap with detailed TODO lists
- Quick reference for deployment and troubleshooting"
```

## 🔄 **Alternative: Feature Branch Strategy**

### **Branch 1: `feature/ml-data-pipeline`**
```bash
git checkout -b feature/ml-data-pipeline
# Add commits 1, 2 (Infrastructure + Data)
git push origin feature/ml-data-pipeline
```

### **Branch 2: `feature/ml-spend-classification`**  
```bash
git checkout -b feature/ml-spend-classification
# Add commit 3 (Spend Classification)
git push origin feature/ml-spend-classification
```

### **Branch 3: `feature/ml-credit-scoring`**
```bash
git checkout -b feature/ml-credit-scoring  
# Add commit 4 (Credit Scoring)
git push origin feature/ml-credit-scoring
```

### **Branch 4: `feature/ml-anomaly-detection`**
```bash
git checkout -b feature/ml-anomaly-detection
# Add commit 5 (Anomaly Detection)  
git push origin feature/ml-anomaly-detection
```

### **Branch 5: `feature/ml-insights-engine`**
```bash
git checkout -b feature/ml-insights-engine
# Add commit 6 (Insights Engine)
git push origin feature/ml-insights-engine
```

### **Branch 6: `feature/ml-api-service`**
```bash
git checkout -b feature/ml-api-service
# Add commits 7, 8 (API + Utilities)
git push origin feature/ml-api-service
```

### **Branch 7: `feature/ml-documentation`**
```bash
git checkout -b feature/ml-documentation  
# Add commits 9, 10 (Agents + Docs)
git push origin feature/ml-documentation
```

## 🎯 **Recommended Approach: Atomic Commits**

### **Phase 1: Core Models (1-5)**
- Mỗi model là một commit riêng biệt
- Dễ review và rollback
- Clear feature boundaries

### **Phase 2: Infrastructure (6-8)**  
- API và utilities
- Supporting components
- Integration layer

### **Phase 3: Documentation (9-10)**
- Complete documentation
- Project management files
- Future roadmap

## 📋 **Pre-commit Checklist**

Trước mỗi commit, đảm bảo:

- [ ] **Code works**: Models train successfully
- [ ] **Tests pass**: API endpoints respond correctly  
- [ ] **No secrets**: Remove any API keys or passwords
- [ ] **Clean files**: Remove temporary files (.pyc, __pycache__)
- [ ] **Consistent style**: Follow PEP8 conventions
- [ ] **Clear commit message**: Use conventional commit format

## 🚀 **Quick Commands**

```bash
# Clean up before commit
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} +
find . -name ".DS_Store" -delete

# Check what will be committed
git status
git diff --cached

# Atomic commit example
git add ml/src/models/spend_clf.py ml/artifacts/models/spend_classifier*
git commit -m "feat: 🏷️ implement spend classification with F1=1.0"

# Push to feature branch
git push origin feature/ml-credit-score
```

---

**Recommendation**: Sử dụng **atomic commits** với clear feature boundaries để dễ review và maintain code base.
