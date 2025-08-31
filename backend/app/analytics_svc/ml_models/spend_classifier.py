"""
Spend Classification Model
Combines rule-based and ML approaches for transaction categorization
"""
import json
import re
from pathlib import Path
from typing import Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from unidecode import unidecode

from ...common.logging import get_logger

logger = get_logger("spend_classifier")


class SpendClassifier:
    """
    Hybrid spend classifier using rules + ML for transaction categorization.
    """

    def __init__(self, model_path: Optional[Path] = None):
        self.mcc_mapping = {}
        self.partner_mapping = {}
        self.ml_pipeline = None
        self.categories = []
        self.is_trained = False
        
        if model_path and model_path.exists():
            self.load_model(model_path)

    def clean_text(self, text: str) -> str:
        """Clean and normalize text for ML processing."""
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
        """Apply rule-based classification first."""
        
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

    def predict(self, description: str, mcc: str = "", merchant_name: str = "") -> Dict:
        """Predict category for a single transaction."""
        if not self.is_trained:
            logger.warning("Model not trained, using fallback categorization")
            return self._fallback_prediction(description, mcc, merchant_name)
        
        try:
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
        except Exception as e:
            logger.error(f"Error in prediction: {e}")
            return self._fallback_prediction(description, mcc, merchant_name)

    def _fallback_prediction(self, description: str, mcc: str, merchant_name: str) -> Dict:
        """Fallback prediction when model fails."""
        # Simple rule-based fallback
        text = f"{description} {merchant_name}".lower()
        
        if any(word in text for word in ['food', 'restaurant', 'cafe', 'eat']):
            category = 'F&B'
        elif any(word in text for word in ['shop', 'store', 'buy', 'purchase']):
            category = 'Shopping'
        elif any(word in text for word in ['transport', 'taxi', 'bus', 'fuel']):
            category = 'Transportation'
        elif any(word in text for word in ['bank', 'atm', 'transfer']):
            category = 'Banking'
        else:
            category = 'Others'
        
        return {
            'category': category,
            'confidence': 0.5,
            'method': 'fallback'
        }

    def predict_batch(self, transactions: List[Dict]) -> List[Dict]:
        """Predict categories for a batch of transactions."""
        predictions = []
        
        for txn in transactions:
            pred = self.predict(
                txn.get('description', ''),
                txn.get('mcc', ''),
                txn.get('merchant_name', '')
            )
            predictions.append(pred)
        
        return predictions

    def load_model(self, model_path: Path):
        """Load a trained model."""
        try:
            model_data = joblib.load(model_path)
            
            self.ml_pipeline = model_data['ml_pipeline']
            self.mcc_mapping = model_data['mcc_mapping']
            self.partner_mapping = model_data['partner_mapping']
            self.categories = model_data['categories']
            self.is_trained = model_data['is_trained']
            
            logger.info(f"Spend classifier loaded from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load model from {model_path}: {e}")
            self.is_trained = False