"""
Script to generate seed data for ML models testing
Creates realistic transaction data for different personas
"""
import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
from pathlib import Path
import json
import random
from typing import Dict, List
from pathlib import Path

# Load config
import sys
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

# Create a simple config for missing imports
SEED_DATA_PATH = Path(__file__).parent
DICTS_ROOT = Path(__file__).parent.parent.parent / "artifacts" / "dicts"

def load_mcc_mapping():
    """Load MCC mapping from artifacts"""
    with open(DICTS_ROOT / "mcc_mapping.json", "r", encoding="utf-8") as f:
        return json.load(f)

def generate_persona_transactions(persona_config: Dict, num_transactions: int = 100) -> List[Dict]:
    """Generate transactions for a specific persona"""
    transactions = []
    mcc_data = load_mcc_mapping()
    
    # Time range: last 6 months
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)
    
    for i in range(num_transactions):
        # Random date in range
        random_days = random.randint(0, 180)
        transaction_date = end_date - timedelta(days=random_days)
        
        # Choose category based on persona preferences
        category = np.random.choice(
            list(persona_config["category_preferences"].keys()),
            p=list(persona_config["category_preferences"].values())
        )
        
        # Get MCC for category
        category_mccs = [
            mcc for mcc, data in mcc_data["mcc_categories"].items()
            if data["category"] == category
        ]
        
        if not category_mccs:
            category_mccs = ["0000"]  # Default
            
        mcc = random.choice(category_mccs)
        mcc_info = mcc_data["mcc_categories"].get(mcc, {
            "category": category,
            "subcategory": "Other", 
            "description": f"{category} Transaction"
        })
        
        # Amount based on category and persona spending pattern
        base_amount = persona_config["spending_ranges"][category]
        amount = np.random.normal(base_amount["mean"], base_amount["std"])
        amount = max(amount, base_amount["min"])
        amount = min(amount, base_amount["max"])
        
        # Add some weekend/weekday patterns
        is_weekend = transaction_date.weekday() >= 5
        if is_weekend and category in ["Entertainment", "F&B"]:
            amount *= 1.2  # Spend more on weekends
            
        # Add location info
        locations = persona_config.get("locations", ["Ho Chi Minh City", "Hanoi"])
        location = random.choice(locations)
        
        # Add some outliers for anomaly detection
        is_outlier = random.random() < 0.05  # 5% outliers
        if is_outlier:
            amount *= random.uniform(3, 10)  # Make it 3-10x normal
            
        transaction = {
            "transaction_id": f"TXN_{persona_config['user_id']}_{i:04d}",
            "user_id": persona_config["user_id"],
            "amount": round(amount, 2),
            "currency": "VND",
            "description": f"{mcc_info['description']} - {mcc_info['subcategory']}",
            "mcc": mcc,
            "category": category,
            "subcategory": mcc_info["subcategory"],
            "merchant_name": mcc_info["description"],
            "transaction_date": transaction_date.isoformat(),
            "location": location,
            "country": "VN",
            "is_weekend": is_weekend,
            "is_outlier": is_outlier,
            "device_id": f"device_{persona_config['user_id']}",
            "ip_address": f"192.168.1.{random.randint(1, 255)}",
            "channel": random.choice(["mobile_app", "web", "pos", "atm"])
        }
        
        transactions.append(transaction)
    
    return transactions

def create_personas():
    """Define different user personas for testing"""
    personas = {
        "frequent_traveler": {
            "user_id": "USER_001",
            "name": "Anh Minh - Frequent Business Traveler",
            "profile": {
                "age": 35,
                "income_level": "high",
                "occupation": "Business Executive",
                "city": "Ho Chi Minh City"
            },
            "category_preferences": {
                "Travel": 0.35,        # High travel spending
                "F&B": 0.25,
                "Accommodation": 0.15,
                "Transportation": 0.10,
                "Shopping": 0.08,
                "Entertainment": 0.05,
                "Healthcare": 0.02
            },
            "spending_ranges": {
                "Travel": {"mean": 3000000, "std": 1000000, "min": 500000, "max": 15000000},
                "F&B": {"mean": 300000, "std": 150000, "min": 50000, "max": 1000000},
                "Accommodation": {"mean": 2500000, "std": 1500000, "min": 800000, "max": 10000000},
                "Transportation": {"mean": 200000, "std": 100000, "min": 30000, "max": 800000},
                "Shopping": {"mean": 500000, "std": 300000, "min": 100000, "max": 2000000},
                "Entertainment": {"mean": 400000, "std": 200000, "min": 100000, "max": 1000000},
                "Healthcare": {"mean": 800000, "std": 400000, "min": 200000, "max": 3000000}
            },
            "locations": ["Ho Chi Minh City", "Hanoi", "Da Nang", "Singapore", "Bangkok"]
        },
        
        "budget_student": {
            "user_id": "USER_002", 
            "name": "Chi Linh - Budget-Conscious Student",
            "profile": {
                "age": 22,
                "income_level": "low",
                "occupation": "University Student",
                "city": "Hanoi"
            },
            "category_preferences": {
                "F&B": 0.40,           # High food spending ratio
                "Transportation": 0.20,
                "Education": 0.15,
                "Shopping": 0.10,
                "Entertainment": 0.10,
                "Travel": 0.03,
                "Healthcare": 0.02
            },
            "spending_ranges": {
                "F&B": {"mean": 80000, "std": 40000, "min": 20000, "max": 300000},
                "Transportation": {"mean": 50000, "std": 25000, "min": 10000, "max": 150000},
                "Education": {"mean": 500000, "std": 200000, "min": 100000, "max": 2000000},
                "Shopping": {"mean": 200000, "std": 100000, "min": 50000, "max": 800000},
                "Entertainment": {"mean": 100000, "std": 50000, "min": 30000, "max": 400000},
                "Travel": {"mean": 800000, "std": 400000, "min": 200000, "max": 3000000},
                "Healthcare": {"mean": 300000, "std": 150000, "min": 50000, "max": 1000000}
            },
            "locations": ["Hanoi", "Ho Chi Minh City"]
        },
        
        "family_spender": {
            "user_id": "USER_003",
            "name": "Duc Huy - Family-Oriented Spender", 
            "profile": {
                "age": 42,
                "income_level": "medium",
                "occupation": "Manager",
                "city": "Da Nang"
            },
            "category_preferences": {
                "F&B": 0.30,
                "Shopping": 0.20,       # Family shopping
                "Healthcare": 0.15,     # Family healthcare
                "Education": 0.12,      # Children education
                "Entertainment": 0.10,
                "Transportation": 0.08,
                "Travel": 0.05
            },
            "spending_ranges": {
                "F&B": {"mean": 400000, "std": 200000, "min": 100000, "max": 1200000},
                "Shopping": {"mean": 800000, "std": 400000, "min": 200000, "max": 3000000},
                "Healthcare": {"mean": 600000, "std": 300000, "min": 150000, "max": 2500000},
                "Education": {"mean": 1000000, "std": 500000, "min": 300000, "max": 4000000},
                "Entertainment": {"mean": 300000, "std": 150000, "min": 80000, "max": 1000000},
                "Transportation": {"mean": 250000, "std": 125000, "min": 50000, "max": 800000},
                "Travel": {"mean": 2000000, "std": 1000000, "min": 500000, "max": 8000000}
            },
            "locations": ["Da Nang", "Hoi An", "Ho Chi Minh City", "Hanoi"]
        }
    }
    
    return personas

def generate_credit_features(transactions_df: pd.DataFrame, user_id: str) -> Dict:
    """Generate credit score features from transaction history"""
    user_txns = transactions_df[transactions_df['user_id'] == user_id].copy()
    
    if len(user_txns) == 0:
        return {}
    
    # Convert amount to numeric
    user_txns['amount'] = pd.to_numeric(user_txns['amount'])
    user_txns['transaction_date'] = pd.to_datetime(user_txns['transaction_date'])
    
    # Monthly aggregations
    user_txns['month'] = user_txns['transaction_date'].dt.to_period('M')
    monthly_stats = user_txns.groupby('month')['amount'].agg(['sum', 'count', 'std']).fillna(0)
    
    features = {
        "user_id": user_id,
        "total_transactions": len(user_txns),
        "total_amount": float(user_txns['amount'].sum()),
        "avg_transaction_amount": float(user_txns['amount'].mean()),
        "std_transaction_amount": float(user_txns['amount'].std() or 0),
        "max_transaction_amount": float(user_txns['amount'].max()),
        "min_transaction_amount": float(user_txns['amount'].min()),
        
        # Monthly patterns
        "avg_monthly_transactions": float(monthly_stats['count'].mean()),
        "std_monthly_transactions": float(monthly_stats['count'].std() or 0),
        "avg_monthly_amount": float(monthly_stats['sum'].mean()),
        "std_monthly_amount": float(monthly_stats['sum'].std() or 0),
        
        # Category diversity
        "unique_categories": user_txns['category'].nunique(),
        "unique_merchants": user_txns['merchant_name'].nunique(),
        "unique_locations": user_txns['location'].nunique(),
        
        # Behavioral patterns
        "weekend_transaction_ratio": float(user_txns['is_weekend'].mean()),
        "outlier_ratio": float(user_txns['is_outlier'].mean()),
        "mobile_usage_ratio": float((user_txns['channel'] == 'mobile_app').mean()),
        
        # Velocity features
        "transactions_last_30_days": len(user_txns[user_txns['transaction_date'] >= user_txns['transaction_date'].max() - pd.Timedelta(days=30)]),
        "amount_last_30_days": float(user_txns[user_txns['transaction_date'] >= user_txns['transaction_date'].max() - pd.Timedelta(days=30)]['amount'].sum()),
    }
    
    # Generate synthetic credit labels (for demo)
    # More realistic scoring with multiple factors
    
    # Transaction volume score (0-1)
    volume_score = min(features["total_transactions"] / 100, 1.0)
    
    # Consistency score (0-1) 
    consistency_score = 1 / (1 + features["std_monthly_amount"] / max(features["avg_monthly_amount"], 1))
    
    # Diversity score (0-1)
    diversity_score = min(features["unique_categories"] / 7, 1.0)
    
    # Outlier penalty (0-1) - more severe penalty
    outlier_penalty = max(0, 1 - features["outlier_ratio"] * 5)
    
    # Volatility penalty (0-1)
    volatility = features["std_transaction_amount"] / max(features["avg_transaction_amount"], 1)
    volatility_penalty = max(0, 1 - volatility / 2)
    
    # Combine scores with weights
    composite_score = (
        volume_score * 0.25 +
        consistency_score * 0.25 +
        diversity_score * 0.2 +
        outlier_penalty * 0.15 +
        volatility_penalty * 0.15
    )
    
    # Add significant randomness to create variety
    noise = np.random.normal(0, 0.2)
    adjusted_score = max(0, min(1, composite_score + noise))
    
    # Map to credit score (300-850)
    credit_score_raw = 300 + adjusted_score * 550
    features["credit_score"] = max(300, min(850, int(credit_score_raw)))
    
    # Create binary labels with threshold at 600
    features["credit_label"] = 1 if features["credit_score"] >= 600 else 0
    
    # Credit grade
    if features["credit_score"] >= 750:
        features["credit_grade"] = "A"
    elif features["credit_score"] >= 650:
        features["credit_grade"] = "B"
    elif features["credit_score"] >= 550:
        features["credit_grade"] = "C"
    else:
        features["credit_grade"] = "D"
    
    return features

def main():
    """Generate all seed data"""
    print("🔄 Generating seed data...")
    
    # Create directories
    SEED_DATA_PATH.mkdir(parents=True, exist_ok=True)
    
    # Generate transactions for all personas
    personas = create_personas()
    all_transactions = []
    credit_features = []
    
    for persona_key, persona_config in personas.items():
        print(f"Generating transactions for {persona_config['name']}...")
        transactions = generate_persona_transactions(persona_config, num_transactions=150)
        all_transactions.extend(transactions)
    
    # Save transactions
    transactions_df = pd.DataFrame(all_transactions)
    transactions_df.to_csv(SEED_DATA_PATH / "transactions.csv", index=False)
    print(f"✅ Saved {len(all_transactions)} transactions to transactions.csv")
    
    # Generate credit features
    print("Generating additional synthetic users for credit model...")
    
    # Time range: last 6 months (redefine since we're outside the function)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)
    mcc_data = load_mcc_mapping()  # Load MCC data
    
    # Create additional synthetic users with different credit profiles
    additional_users = []
    for i in range(15):  # Add 15 more synthetic users
        user_id = f"SYNTH_{i+1:03d}"
        
        # Generate different risk profiles with more diversity
        risk_profile = np.random.choice(['excellent', 'good', 'fair', 'poor'], p=[0.2, 0.3, 0.3, 0.2])
        
        if risk_profile == 'excellent':
            # Conservative, very stable patterns
            num_txns = np.random.randint(100, 150)
            spending_categories = {
                "F&B": 0.25, "Transportation": 0.15, "Shopping": 0.15, 
                "Healthcare": 0.15, "Entertainment": 0.1, "Travel": 0.1, "Education": 0.1
            }
            volatility_factor = 0.6  # Very low volatility
            outlier_rate = 0.01
        elif risk_profile == 'good':
            # Moderate, stable patterns
            num_txns = np.random.randint(70, 120)
            spending_categories = {
                "F&B": 0.3, "Transportation": 0.2, "Shopping": 0.2, 
                "Healthcare": 0.15, "Entertainment": 0.1, "Travel": 0.05
            }
            volatility_factor = 0.8  # Low volatility
            outlier_rate = 0.03
        elif risk_profile == 'fair': 
            # Some irregularities
            num_txns = np.random.randint(40, 80)
            spending_categories = {
                "Shopping": 0.35, "F&B": 0.25, "Entertainment": 0.2,
                "Transportation": 0.1, "Travel": 0.05, "Healthcare": 0.05
            }
            volatility_factor = 1.5
            outlier_rate = 0.08
        else:  # poor
            # Erratic, very risky patterns
            num_txns = np.random.randint(15, 50)
            spending_categories = {
                "Entertainment": 0.5, "Travel": 0.25, "Shopping": 0.15,
                "F&B": 0.1
            }
            volatility_factor = 3.0  # Very high volatility
            outlier_rate = 0.20
        
        # Generate transactions for this synthetic user
        synthetic_txns = []
        for j in range(num_txns):
            # Random date
            random_days = random.randint(0, 180)
            transaction_date = end_date - timedelta(days=random_days)
            
            # Choose category based on risk profile
            category = np.random.choice(
                list(spending_categories.keys()),
                p=list(spending_categories.values())
            )
            
            # Amount with volatility based on risk profile
            base_amounts = {
                "F&B": 150000, "Transportation": 100000, "Shopping": 500000,
                "Entertainment": 300000, "Travel": 2000000, "Healthcare": 800000
            }
            
            base_amount = base_amounts.get(category, 200000)
            amount = base_amount * np.random.lognormal(0, 0.5) * volatility_factor
            
            # Add outliers based on risk profile
            is_outlier = random.random() < outlier_rate
            if is_outlier:
                amount *= random.uniform(5, 15)
            
            # Get MCC
            category_mccs = [
                mcc for mcc, data in mcc_data["mcc_categories"].items()
                if data["category"] == category
            ]
            mcc = random.choice(category_mccs) if category_mccs else "0000"
            mcc_info = mcc_data["mcc_categories"].get(mcc, {
                "category": category, "subcategory": "Other", "description": f"{category} Transaction"
            })
            
            is_weekend = transaction_date.weekday() >= 5
            
            transaction = {
                "transaction_id": f"TXN_{user_id}_{j:04d}",
                "user_id": user_id,
                "amount": round(amount, 2),
                "currency": "VND",
                "description": f"{mcc_info['description']} - {mcc_info['subcategory']}",
                "mcc": mcc,
                "category": category,
                "subcategory": mcc_info["subcategory"],
                "merchant_name": mcc_info["description"],
                "transaction_date": transaction_date.isoformat(),
                "location": random.choice(["Ho Chi Minh City", "Hanoi", "Da Nang"]),
                "country": "VN",
                "is_weekend": is_weekend,
                "is_outlier": is_outlier,
                "device_id": f"device_{user_id}",
                "ip_address": f"192.168.1.{random.randint(1, 255)}",
                "channel": random.choice(["mobile_app", "web", "pos", "atm"])
            }
            
            synthetic_txns.append(transaction)
        
        all_transactions.extend(synthetic_txns)
    
    # Recreate the transactions DataFrame with all data
    transactions_df = pd.DataFrame(all_transactions)
    transactions_df.to_csv(SEED_DATA_PATH / "transactions.csv", index=False)
    print(f"✅ Updated transactions.csv with {len(all_transactions)} total transactions")
    
    # Generate credit features for all users
    all_user_ids = transactions_df['user_id'].unique()
    credit_features = []
    for user_id in all_user_ids:
        features = generate_credit_features(transactions_df, user_id)
        credit_features.append(features)
    
    # Save credit features
    credit_df = pd.DataFrame(credit_features)
    credit_df.to_csv(SEED_DATA_PATH / "credit_features.csv", index=False)
    print(f"✅ Saved credit features for {len(credit_features)} users")
    
    # Save personas info
    with open(SEED_DATA_PATH / "personas.json", "w", encoding="utf-8") as f:
        json.dump(personas, f, indent=2, ensure_ascii=False)
    print("✅ Saved personas.json")
    
    # Generate some test cases for anomaly detection
    anomaly_cases = []
    for persona_key, persona_config in personas.items():
        # Normal transaction
        normal_case = {
            "user_id": persona_config['user_id'],
            "amount": 200000,
            "category": "F&B",
            "location": "Ho Chi Minh City",
            "time_since_last_txn_hours": 12,
            "expected_anomaly": False,
            "description": "Normal lunch transaction"
        }
        
        # Large amount anomaly
        large_amount_case = {
            "user_id": persona_config['user_id'], 
            "amount": 50000000,  # 50M VND - very large
            "category": "Shopping",
            "location": "Ho Chi Minh City",
            "time_since_last_txn_hours": 2,
            "expected_anomaly": True,
            "description": "Unusually large shopping transaction"
        }
        
        # Location anomaly
        location_case = {
            "user_id": persona_config['user_id'],
            "amount": 500000,
            "category": "F&B", 
            "location": "Paris, France",  # Unusual location
            "time_since_last_txn_hours": 1,
            "expected_anomaly": True,
            "description": "Transaction in unusual location"
        }
        
        # Velocity anomaly
        velocity_case = {
            "user_id": persona_config['user_id'],
            "amount": 1000000,
            "category": "Shopping",
            "location": "Ho Chi Minh City",
            "time_since_last_txn_hours": 0.1,  # 6 minutes ago
            "expected_anomaly": True,
            "description": "High velocity transaction"
        }
        
        anomaly_cases.extend([normal_case, large_amount_case, location_case, velocity_case])
    
    # Save test cases
    anomaly_df = pd.DataFrame(anomaly_cases)
    anomaly_df.to_csv(SEED_DATA_PATH / "anomaly_test_cases.csv", index=False)
    print(f"✅ Saved {len(anomaly_cases)} anomaly test cases")
    
    # Print summary
    print("\n📊 Data Summary:")
    print(f"Total transactions: {len(all_transactions)}")
    print(f"Date range: {transactions_df['transaction_date'].min()} to {transactions_df['transaction_date'].max()}")
    print(f"Total amount: {transactions_df['amount'].sum():,.0f} VND")
    print(f"Categories: {transactions_df['category'].unique()}")
    print(f"Users: {transactions_df['user_id'].unique()}")
    
    print("\n🎯 Credit Score Distribution:")
    for _, features in credit_df.iterrows():
        print(f"  {features['user_id']}: {features['credit_score']} ({features['credit_grade']})")
    
    print("\n✅ Seed data generation completed!")

if __name__ == "__main__":
    main()
