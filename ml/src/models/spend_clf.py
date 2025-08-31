"""
Spend Classification Model
Combines rule-based and ML approaches for transaction categorization
"""
import pandas as pd
import numpy as np
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import joblib
from unidecode import unidecode

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.pipeline import Pipeline
import warnings
warnings.filterwarnings('ignore')

class SpendClassifier:
    """
    Hybrid spend classifier using rules + ML
    """
    
    def __init__(self, config_path: Optional[Path] = None):
        self.mcc_mapping = {}
        self.partner_mapping = {}
        self.ml_pipeline = None
        self.categories = []
        self.is_trained = False
        
        # Load configuration
        if config_path:
            self.load_config(config_path)
    
    def load_config(self, config_path: Path):
        """Load MCC mapping and partner information"""
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        self.mcc_mapping = config.get('mcc_categories', {})
        self.partner_mapping = config.get('partners', {})
        
    def clean_text(self, text: str) -> str:
        """Clean and normalize text for ML processing"""
        if pd.isna(text) or text is None:
            return ""
        
        # Convert to string and lowercase
        text = str(text).lower()
        
        # Remove accents
        text = unidecode(text)
        
        # Remove special characters, keep only alphanumeric and spaces
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        
        # Remove extra spaces
        text = ' '.join(text.split())
        
        return text
    
    def apply_rules(self, description: str, mcc: str, merchant_name: str) -> Optional[str]:
        """Apply rule-based classification first"""
        
        # MCC-based rules
        if str(mcc) in self.mcc_mapping:
            return self.mcc_mapping[str(mcc)]['category']
        
        # Partner-based rules
        clean_desc = self.clean_text(description)
        clean_merchant = self.clean_text(merchant_name)
        combined_text = f"{clean_desc} {clean_merchant}"
        
        for partner_key, partner_info in self.partner_mapping.items():
            keywords = partner_info.get('keywords', [])
            for keyword in keywords:
                if keyword.lower() in combined_text:
                    return partner_info['category']
        
        # Keyword-based rules
        keyword_rules = {
            'Travel': ['vietjet', 'vietnam airlines', 'bamboo airways', 'flight', 'airline', 'airport', 'ticket'],
            'Accommodation': ['hotel', 'resort', 'motel', 'homestay', 'airbnb', 'booking', 'lodge'],
            'F&B': ['restaurant', 'cafe', 'coffee', 'food', 'eat', 'drink', 'pizza', 'burger', 'pho', 'com'],
            'Transportation': ['taxi', 'grab', 'uber', 'bus', 'train', 'fuel', 'gas', 'petrol', 'parking'],
            'Shopping': ['shop', 'store', 'mall', 'market', 'buy', 'purchase', 'retail', 'clothing'],
            'Entertainment': ['movie', 'cinema', 'game', 'sport', 'gym', 'music', 'concert', 'club'],
            'Healthcare': ['hospital', 'clinic', 'doctor', 'pharmacy', 'medical', 'health', 'drug'],
            'Education': ['school', 'university', 'course', 'book', 'tuition', 'education', 'learn'],
            'Banking': ['bank', 'atm', 'transfer', 'loan', 'insurance', 'credit', 'finance']
        }
        
        for category, keywords in keyword_rules.items():
            for keyword in keywords:
                if keyword in combined_text:
                    return category
        
        return None  # No rule matched
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features for ML model"""
        # Combine text features
        df = df.copy()
        df['description'] = df['description'].fillna('')
        df['merchant_name'] = df['merchant_name'].fillna('')
        
        # Clean and combine text
        df['combined_text'] = (
            df['description'].apply(self.clean_text) + ' ' + 
            df['merchant_name'].apply(self.clean_text)
        )
        
        X = df['combined_text'].values
        y = df['category'].values if 'category' in df.columns else None
        
        return X, y
    
    def train(self, df: pd.DataFrame, test_size: float = 0.2) -> Dict:
        """Train the hybrid classifier"""
        print("🔄 Training spend classifier...")
        
        # Apply rules first
        df = df.copy()
        df['rule_prediction'] = df.apply(
            lambda row: self.apply_rules(
                row.get('description', ''), 
                row.get('mcc', ''), 
                row.get('merchant_name', '')
            ), axis=1
        )
        
        # Count rule coverage
        rule_covered = df['rule_prediction'].notna().sum()
        total_samples = len(df)
        rule_coverage = rule_covered / total_samples
        
        print(f"📊 Rule coverage: {rule_covered}/{total_samples} ({rule_coverage:.1%})")
        
        # For ML training, use samples where rules didn't work or for validation
        X, y = self.prepare_features(df)
        self.categories = sorted(df['category'].unique())
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        # Build ML pipeline
        self.ml_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                max_features=1000,
                ngram_range=(1, 2),
                stop_words='english',
                lowercase=True
            )),
            ('classifier', LogisticRegression(
                random_state=42,
                max_iter=1000,
                class_weight='balanced'
            ))
        ])
        
        # Train ML model
        self.ml_pipeline.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.ml_pipeline.predict(X_test)
        ml_f1 = f1_score(y_test, y_pred, average='macro')
        
        # Hybrid evaluation
        df_test = df.iloc[X_test.index] if hasattr(X_test, 'index') else df
        hybrid_predictions = []
        
        for _, row in df_test.iterrows():
            rule_pred = self.apply_rules(
                row.get('description', ''), 
                row.get('mcc', ''), 
                row.get('merchant_name', '')
            )
            
            if rule_pred:
                hybrid_predictions.append(rule_pred)
            else:
                # Fallback to ML
                combined_text = self.clean_text(str(row.get('description', ''))) + ' ' + \
                               self.clean_text(str(row.get('merchant_name', '')))
                ml_pred = self.ml_pipeline.predict([combined_text])[0]
                hybrid_predictions.append(ml_pred)
        
        # Calculate hybrid F1
        if len(hybrid_predictions) == len(y_test):
            hybrid_f1 = f1_score(y_test, hybrid_predictions, average='macro')
        else:
            hybrid_f1 = ml_f1  # Fallback
        
        self.is_trained = True
        
        metrics = {
            'rule_coverage': rule_coverage,
            'ml_f1_score': ml_f1,
            'hybrid_f1_score': hybrid_f1,
            'total_samples': total_samples,
            'categories': self.categories
        }
        
        print(f"✅ Training completed!")
        print(f"   ML F1-Score: {ml_f1:.3f}")
        print(f"   Hybrid F1-Score: {hybrid_f1:.3f}")
        print(f"   Categories: {len(self.categories)}")
        
        return metrics
    
    def predict(self, description: str, mcc: str = "", merchant_name: str = "") -> Dict:
        """Predict category for a single transaction"""
        if not self.is_trained:
            raise ValueError("Model not trained yet!")
        
        # Try rules first
        rule_pred = self.apply_rules(description, mcc, merchant_name)
        
        if rule_pred:
            return {
                'category': rule_pred,
                'confidence': 0.95,  # High confidence for rule-based
                'method': 'rule-based'
            }
        
        # Fallback to ML
        combined_text = self.clean_text(description) + ' ' + self.clean_text(merchant_name)
        ml_pred = self.ml_pipeline.predict([combined_text])[0]
        ml_proba = self.ml_pipeline.predict_proba([combined_text])[0]
        
        # Get confidence (max probability)
        confidence = float(np.max(ml_proba))
        
        return {
            'category': ml_pred,
            'confidence': confidence,
            'method': 'ml-based',
            'all_probabilities': {
                cat: float(prob) for cat, prob in zip(self.categories, ml_proba)
            }
        }
    
    def predict_batch(self, df: pd.DataFrame) -> List[Dict]:
        """Predict categories for a batch of transactions"""
        predictions = []
        
        for _, row in df.iterrows():
            pred = self.predict(
                row.get('description', ''),
                row.get('mcc', ''),
                row.get('merchant_name', '')
            )
            predictions.append(pred)
        
        return predictions
    
    def save_model(self, model_path: Path):
        """Save the trained model"""
        if not self.is_trained:
            raise ValueError("No trained model to save!")
        
        model_data = {
            'ml_pipeline': self.ml_pipeline,
            'mcc_mapping': self.mcc_mapping,
            'partner_mapping': self.partner_mapping,
            'categories': self.categories,
            'is_trained': self.is_trained
        }
        
        joblib.dump(model_data, model_path)
        print(f"✅ Model saved to {model_path}")
    
    def load_model(self, model_path: Path):
        """Load a trained model"""
        model_data = joblib.load(model_path)
        
        self.ml_pipeline = model_data['ml_pipeline']
        self.mcc_mapping = model_data['mcc_mapping']
        self.partner_mapping = model_data['partner_mapping']
        self.categories = model_data['categories']
        self.is_trained = model_data['is_trained']
        
        print(f"✅ Model loaded from {model_path}")

def train_spend_classifier():
    """Train and save the spend classifier"""
    import sys
    sys.path.append(str(Path(__file__).parent.parent))
    from config import SEED_DATA_PATH, DICTS_ROOT, MODELS_ROOT
    
    # Create models directory
    MODELS_ROOT.mkdir(parents=True, exist_ok=True)
    
    # Load data
    df = pd.read_csv(SEED_DATA_PATH / "transactions.csv")
    print(f"📊 Loaded {len(df)} transactions")
    
    # Initialize and train classifier
    classifier = SpendClassifier(DICTS_ROOT / "mcc_mapping.json")
    metrics = classifier.train(df)
    
    # Save model
    model_path = MODELS_ROOT / "spend_classifier.joblib"
    classifier.save_model(model_path)
    
    # Save metrics
    metrics_path = MODELS_ROOT / "spend_classifier_metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"✅ Metrics saved to {metrics_path}")
    
    # Test some predictions
    print("\n🧪 Testing predictions:")
    test_cases = [
        {"description": "VietJet flight booking", "mcc": "3003", "merchant_name": "VietJet Air"},
        {"description": "Coffee shop payment", "mcc": "5814", "merchant_name": "Highlands Coffee"},
        {"description": "Sovico Resort booking", "mcc": "3503", "merchant_name": "Sovico Resort"},
        {"description": "ATM withdrawal", "mcc": "6011", "merchant_name": "HDBank ATM"}
    ]
    
    for test_case in test_cases:
        pred = classifier.predict(**test_case)
        print(f"  '{test_case['description']}' → {pred['category']} ({pred['confidence']:.2f}, {pred['method']})")
    
    return classifier, metrics

if __name__ == "__main__":
    train_spend_classifier()
