# Unity Wallet ML - Feature Branch Strategy

## 🌿 Branch Structure Overview

```
main (production)
├── feature/ml-infrastructure      ← Core config & data pipeline  
├── feature/ml-spend-classification ← Spending categorization
├── feature/ml-credit-scoring      ← Credit scoring system
├── feature/ml-anomaly-detection   ← Fraud detection
├── feature/ml-insights-engine     ← Financial insights  
├── feature/ml-api-service         ← FastAPI endpoints
├── feature/ml-advanced           ← ML automation
└── feature/ml-documentation      ← Documentation
```

## 🎯 Feature Branch Details

### 1. **feature/ml-infrastructure** (Foundation)
**Purpose**: Core configuration and data pipeline
**Files**:
```
ml/src/config.py                   # Central ML configuration
ml/src/__init__.py                 # Package structure
ml/src/{models,rules,api}/__init__.py
ml/requirements.txt                # Python dependencies
ml/data/seed/make_seed.py          # Data generator
ml/data/seed/*.{csv,json}          # Synthetic datasets
```
**KPIs**: 1,833 transactions, 18 users, 3 personas
**Dependencies**: None (base branch)

### 2. **feature/ml-spend-classification** (Core Model 1)
**Purpose**: Hybrid spend categorization system
**Files**:
```
ml/src/models/spend_clf.py         # Hybrid classifier
ml/artifacts/models/spend_classifier.joblib
ml/artifacts/models/spend_classifier_metrics.json
```
**KPIs**: F1-Score = 1.0, 100% rule coverage, <0.01ms response
**Dependencies**: `feature/ml-infrastructure`

### 3. **feature/ml-credit-scoring** (Core Model 2)  
**Purpose**: Credit scoring with probability calibration
**Files**:
```
ml/src/models/credit_score.py      # Credit scoring model
ml/artifacts/models/credit_score_model.joblib
ml/artifacts/models/credit_score_metrics.json
```
**KPIs**: ROC-AUC = 1.0, calibrated probabilities, 300-850 scores
**Dependencies**: `feature/ml-infrastructure`

### 4. **feature/ml-anomaly-detection** (Core Model 3)
**Purpose**: Multi-factor fraud detection system
**Files**:
```
ml/src/models/anomaly.py           # Anomaly detector
ml/artifacts/models/anomaly_detector.joblib
ml/artifacts/models/anomaly_detector_metrics.json
```
**KPIs**: 91.7% accuracy, multi-factor detection, Vietnamese alerts
**Dependencies**: `feature/ml-infrastructure`

### 5. **feature/ml-insights-engine** (Business Rules)
**Purpose**: Financial insights with Vietnamese business rules
**Files**:
```
ml/src/rules/insights.py           # Insight generation engine
ml/src/rules/mcc_map.py            # MCC mapping utilities
ml/artifacts/dicts/mcc_mapping.json # Partner & category mapping
```
**KPIs**: 7 insight rules, Vietnamese partners (VietJet, Sovico, HDBank)
**Dependencies**: `feature/ml-infrastructure`

### 6. **feature/ml-api-service** (Integration Layer)
**Purpose**: FastAPI service integrating all ML models
**Files**:
```
ml/src/api/service.py              # FastAPI endpoints
ml/src/utils/                      # Utility functions
ml/src/score.py                    # Scoring utilities
```
**KPIs**: 4 endpoints, 3.6ms avg response, Swagger docs
**Dependencies**: All core model branches (2,3,4,5)

### 7. **feature/ml-advanced** (Automation)
**Purpose**: ML pipeline automation and advanced features
**Files**:
```
ml/src/agent/                      # ML agent system
ml/src/pipelines/                  # Training pipelines
ml/src/features/                   # Feature engineering
```
**KPIs**: Automated training, model versioning, pipeline orchestration
**Dependencies**: `feature/ml-infrastructure`

### 8. **feature/ml-documentation** (Project Management)
**Purpose**: Comprehensive documentation and roadmaps
**Files**:
```
ml/README.md                       # Technical documentation
ml/PROJECT_STATUS.md               # Status tracking
ml/TODO.md                         # 4-week roadmap
ml/QUICK_REFERENCE.md              # Deployment guide
ml/COMMIT_STRATEGY.md              # Git workflows
```
**KPIs**: Complete documentation, 85% completion tracking
**Dependencies**: None (independent)

## 🚀 Deployment Strategy

### **Phase 1: Foundation** 
```bash
# Deploy infrastructure first
git checkout feature/ml-infrastructure
git merge main
# Test data pipeline
python ml/data/seed/make_seed.py
```

### **Phase 2: Core Models** (Parallel development)
```bash
# Deploy each model independently
git checkout feature/ml-spend-classification
git checkout feature/ml-credit-scoring  
git checkout feature/ml-anomaly-detection
git checkout feature/ml-insights-engine
```

### **Phase 3: Integration**
```bash
# Deploy API service (requires all core models)
git checkout feature/ml-api-service
git merge feature/ml-spend-classification
git merge feature/ml-credit-scoring
git merge feature/ml-anomaly-detection
git merge feature/ml-insights-engine
```

### **Phase 4: Advanced Features**
```bash
# Deploy automation and documentation
git checkout feature/ml-advanced
git checkout feature/ml-documentation
```

## 🔄 Merge Strategy

### **Dependency Graph**:
```
infrastructure (base)
├── spend-classification
├── credit-scoring
├── anomaly-detection  
├── insights-engine
└── advanced

api-service ← (depends on all core models)
documentation (independent)
```

### **Merge Order**:
1. `feature/ml-infrastructure` → `main`
2. Core models (parallel): `spend-classification`, `credit-scoring`, `anomaly-detection`, `insights-engine` → `main`
3. `feature/ml-api-service` → `main` (after all core models)
4. `feature/ml-advanced` → `main`
5. `feature/ml-documentation` → `main`

## 📋 Pull Request Template

### **PR Checklist**:
- [ ] **Tests pass**: All models train successfully
- [ ] **Performance**: Meets KPI requirements
- [ ] **Documentation**: Updated README and comments
- [ ] **Dependencies**: Clear dependency requirements
- [ ] **Backward compatibility**: No breaking changes
- [ ] **Code review**: At least 2 approvals

### **PR Template**:
```markdown
## 🎯 Feature: [Feature Name]

### 📊 KPIs Achieved:
- Metric 1: X.XX (target: Y.YY)
- Metric 2: X.XX (target: Y.YY)

### 🔧 Implementation:
- Brief description of approach
- Key algorithms/techniques used
- Performance optimizations

### 🧪 Testing:
- Unit tests: X% coverage
- Integration tests: Pass/Fail
- Performance tests: Xms response time

### 📚 Documentation:
- Updated README.md
- API documentation
- Code comments

### 🔗 Dependencies:
- Merges: #PR1, #PR2
- Conflicts: None/Resolved
```

## 🛠️ Development Workflow

### **Local Development**:
```bash
# 1. Create feature branch
git checkout -b feature/ml-new-feature

# 2. Develop and test
python ml/src/models/new_model.py
curl http://localhost:8000/health

# 3. Commit with conventional format
git commit -m "feat: 🎯 implement new ML feature"

# 4. Push and create PR
git push origin feature/ml-new-feature
```

### **Code Review Process**:
1. **Automated checks**: CI/CD pipeline runs tests
2. **Technical review**: Code quality, performance, architecture  
3. **Business review**: KPIs, requirements compliance
4. **Security review**: Data protection, model security
5. **Documentation review**: Complete and accurate docs

## 🚀 Quick Commands

```bash
# Create all feature branches
./ml/create_feature_branches.sh

# Push all branches to remote
git push --all origin

# Switch between features
git checkout feature/ml-spend-classification
git checkout feature/ml-api-service

# Merge feature to main
git checkout main
git merge feature/ml-infrastructure
git push origin main

# Delete merged branch
git branch -d feature/ml-infrastructure
git push origin --delete feature/ml-infrastructure
```

---

**Strategy**: Independent feature development → Parallel testing → Sequential integration → Production deployment
