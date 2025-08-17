# Unity Wallet ML - Branch Naming Convention

## 🌿 Proposed Branch Structure

### **Main Branches**
```
main                                    # Production branch
develop                                 # Integration branch (optional)
```

### **Feature Branches - Core ML Components**

#### **1. Infrastructure & Foundation**
```
feature/ml-infrastructure               # Core config + data pipeline
feature/ml-data-pipeline               # Alternative: focus only on data
feature/ml-foundation                  # Alternative: broader foundation
```

#### **2. ML Models (Individual)**
```
feature/ml-spend-classification        # Spending categorization
feature/ml-credit-scoring             # Credit scoring system  
feature/ml-anomaly-detection          # Fraud detection
feature/ml-insights-engine            # Financial insights
```

#### **3. API & Integration**
```
feature/ml-api-service                # FastAPI endpoints
feature/ml-api-integration            # Alternative: focus on integration
feature/ml-rest-api                   # Alternative: emphasize REST
```

#### **4. Advanced Features**
```
feature/ml-automation                 # ML pipeline automation
feature/ml-advanced-models            # Advanced ML features
feature/ml-pipeline-orchestration     # Alternative: focus on orchestration
```

#### **5. DevOps & Documentation**
```
feature/ml-documentation              # Documentation
feature/ml-deployment                 # Deployment configs
feature/ml-monitoring                 # Monitoring & observability
```

## 🎯 **RECOMMENDED STRUCTURE** (Most Logical)

### **Phase 1: Foundation**
```
feature/ml-infrastructure             # ✅ Recommended
├── Core configuration (config.py)
├── Package structure (__init__.py files)
├── Dependencies (requirements.txt)
└── Data pipeline (make_seed.py + datasets)
```

### **Phase 2: Core ML Models** (Parallel Development)
```
feature/ml-spend-classification       # ✅ Recommended
├── Hybrid classifier (spend_clf.py)
├── Trained model (.joblib)
└── Performance metrics (.json)

feature/ml-credit-scoring            # ✅ Recommended  
├── Credit model (credit_score.py)
├── Trained model (.joblib)
└── Performance metrics (.json)

feature/ml-anomaly-detection         # ✅ Recommended
├── Anomaly detector (anomaly.py)
├── Trained model (.joblib)
└── Performance metrics (.json)

feature/ml-insights-engine           # ✅ Recommended
├── Insights rules (insights.py)
├── MCC mapping (mcc_map.py)
└── Partner data (mcc_mapping.json)
```

### **Phase 3: Integration & API**
```
feature/ml-api-service               # ✅ Recommended
├── FastAPI service (service.py)
├── Utility functions (utils/)
└── Performance tracking
```

### **Phase 4: Advanced & DevOps**
```
feature/ml-automation                # ✅ Recommended
├── ML agents (agent/)
├── Training pipelines (pipelines/)
└── Feature engineering (features/)

feature/ml-documentation             # ✅ Recommended
├── Technical docs (README.md)
├── Project status (PROJECT_STATUS.md)
├── Deployment guide (QUICK_REFERENCE.md)
└── Roadmap (TODO.md)
```

## 🏷️ **Alternative Naming Conventions**

### **Option A: Component-Based**
```
feature/ml-models-spend              # Focus on model type
feature/ml-models-credit
feature/ml-models-anomaly
feature/ml-rules-insights
feature/ml-api-rest
feature/ml-infra-core
```

### **Option B: Function-Based**
```
feature/spending-classification      # Focus on business function
feature/credit-assessment
feature/fraud-detection
feature/financial-insights
feature/ml-api-layer
feature/ml-foundation
```

### **Option C: Layer-Based**
```
feature/ml-data-layer               # Focus on architecture layer
feature/ml-model-layer
feature/ml-business-layer
feature/ml-api-layer
feature/ml-infrastructure-layer
```

## 🎯 **FINAL RECOMMENDATION**

Use **Component-Based** naming with clear ML prefix:

```bash
# Core Infrastructure
feature/ml-infrastructure           # Foundation & data pipeline

# Individual ML Models  
feature/ml-spend-classification     # Spending categorization
feature/ml-credit-scoring          # Credit scoring
feature/ml-anomaly-detection       # Fraud detection
feature/ml-insights-engine         # Financial insights

# Integration Layer
feature/ml-api-service             # FastAPI endpoints

# Advanced Features
feature/ml-automation              # Pipeline automation
feature/ml-documentation           # Complete documentation
```

## 🔧 **Branch Creation Commands**

```bash
# Current branch: feature/ml-credit-score
# Create new branches from current state

git checkout -b feature/ml-infrastructure
git checkout -b feature/ml-spend-classification  
git checkout -b feature/ml-anomaly-detection
git checkout -b feature/ml-insights-engine
git checkout -b feature/ml-api-service
git checkout -b feature/ml-automation
git checkout -b feature/ml-documentation
```

## 🏷️ **Branch Prefixes Explained**

- **`feature/`** - New functionality being developed
- **`ml-`** - Machine Learning specific components
- **`component-name`** - Clear, descriptive component name

### **Benefits of This Convention:**
1. **Clear scope**: Each branch has specific ML component
2. **Parallel development**: Independent feature development
3. **Easy merging**: Clear dependency relationships
4. **Maintainable**: Logical structure for long-term maintenance

---

**Final Answer**: Use `feature/ml-[component-name]` format với 7 branches chính như trên.
