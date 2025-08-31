"""
Configuration settings for the ML module
"""
import os
from pathlib import Path
from typing import Dict, List

# Base paths
ML_ROOT = Path(__file__).parent.parent
DATA_ROOT = ML_ROOT / "data"
ARTIFACTS_ROOT = ML_ROOT / "artifacts"
MODELS_ROOT = ARTIFACTS_ROOT / "models"
DICTS_ROOT = ARTIFACTS_ROOT / "dicts"

# Data paths
RAW_DATA_PATH = DATA_ROOT / "raw"
PROCESSED_DATA_PATH = DATA_ROOT / "processed" 
SEED_DATA_PATH = DATA_ROOT / "seed"

# Model configurations
SPEND_CLASSIFIER_CONFIG = {
    "model_type": "logistic_regression",
    "tfidf_max_features": 1000,
    "tfidf_ngram_range": (1, 2),
    "random_state": 42,
    "test_size": 0.2
}

CREDIT_SCORE_CONFIG = {
    "model_type": "logistic_regression", 
    "score_range": (300, 850),
    "grade_thresholds": {
        "A": 750,
        "B": 650, 
        "C": 550,
        "D": 450
    },
    "random_state": 42,
    "calibration": True
}

ANOMALY_DETECTION_CONFIG = {
    "z_score_threshold": 2.5,
    "iqr_multiplier": 1.5,
    "velocity_window_hours": 24,
    "geo_radius_km": 50,
    "cooldown_hours": 6,
    "alert_threshold": 0.7
}

# Categories mapping
SPEND_CATEGORIES = {
    "Travel": ["airline", "hotel", "taxi", "car_rental", "travel_agency"],
    "F&B": ["restaurant", "fast_food", "grocery", "cafe", "bar"],
    "Accommodation": ["hotel", "resort", "homestay", "apartment"],
    "Banking": ["atm", "bank_transfer", "loan_payment", "insurance"],
    "Shopping": ["retail", "online", "department_store", "supermarket"],
    "Entertainment": ["movie", "gaming", "sports", "music"],
    "Healthcare": ["hospital", "pharmacy", "clinic", "dental"],
    "Education": ["school", "university", "course", "books"],
    "Transportation": ["fuel", "parking", "public_transport", "toll"],
    "Others": ["misc", "unknown", "other"]
}

# MCC code ranges (simplified)
MCC_CATEGORY_MAPPING = {
    # Airlines
    "3000-3299": "Travel",
    # Hotels/Lodging  
    "3500-3999": "Accommodation",
    # Restaurants
    "5800-5899": "F&B",
    # Gas stations
    "5540-5599": "Transportation",
    # Grocery stores
    "5400-5499": "F&B",
    # Department stores
    "5300-5399": "Shopping",
    # Default
    "default": "Others"
}

# API settings
API_CONFIG = {
    "max_response_time_ms": 300,
    "cache_ttl_seconds": 300,
    "max_requests_per_minute": 100
}

# Logging
LOG_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": ML_ROOT / "logs" / "ml_service.log"
}
