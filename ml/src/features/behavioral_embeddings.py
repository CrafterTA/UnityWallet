"""
Advanced Behavioral Embeddings for Unity Wallet
Creates dense vector representations of user spending behavior
"""

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.manifold import TSNE
import umap
from typing import Dict, List, Optional, Tuple, Any
import warnings
warnings.filterwarnings('ignore')

class BehavioralEmbeddings:
    """
    Advanced behavioral embedding generator for financial users
    
    Creates dense vector representations capturing:
    - Spending patterns and preferences
    - Temporal behavior signatures  
    - Merchant loyalty and diversity
    - Risk and fraud indicators
    - Lifestyle and demographic proxies
    """
    
    def __init__(self, embedding_dim: int = 32, n_clusters: int = 8):
        self.embedding_dim = embedding_dim
        self.n_clusters = n_clusters
        
        # Models
        self.user_clusterer = KMeans(n_clusters=n_clusters, random_state=42)
        self.merchant_clusterer = KMeans(n_clusters=10, random_state=42)
        self.scaler = StandardScaler()
        self.dimensionality_reducer = None
        
        # Encoders
        self.category_encoder = LabelEncoder()
        self.merchant_encoder = LabelEncoder()
        
        # Trained flags
        self.is_fitted = False
        
    def fit_transform(self, transactions_df: pd.DataFrame) -> Dict[str, np.ndarray]:
        """
        Fit embedding models and transform all users
        
        Args:
            transactions_df: DataFrame with [user_id, amount, timestamp, category, merchant]
            
        Returns:
            Dictionary mapping user_id -> embedding vector
        """
        
        print("🧠 Training behavioral embedding models...")
        
        # 1. Extract comprehensive behavioral features for all users
        user_features = {}
        unique_users = transactions_df['user_id'].unique()
        
        for user_id in unique_users:
            features = self._extract_comprehensive_features(transactions_df, user_id)
            user_features[user_id] = features
            
        # 2. Create feature matrix
        feature_matrix = np.array(list(user_features.values()))
        user_ids = list(user_features.keys())
        
        print(f"📊 Extracted {feature_matrix.shape[1]} behavioral features for {len(user_ids)} users")
        
        # 3. Fit preprocessing
        feature_matrix_scaled = self.scaler.fit_transform(feature_matrix)
        
        # 4. Fit clustering models
        self.user_clusterer.fit(feature_matrix_scaled)
        
        # 5. Fit dimensionality reduction
        if self.embedding_dim < feature_matrix.shape[1]:
            # Try UMAP first (better for non-linear patterns)
            try:
                self.dimensionality_reducer = umap.UMAP(
                    n_components=self.embedding_dim,
                    random_state=42,
                    min_dist=0.1,
                    n_neighbors=min(15, len(user_ids)//2)
                )
                embeddings_matrix = self.dimensionality_reducer.fit_transform(feature_matrix_scaled)
                print("✅ Using UMAP for dimensionality reduction")
            except:
                # Fallback to PCA
                self.dimensionality_reducer = PCA(n_components=self.embedding_dim, random_state=42)
                embeddings_matrix = self.dimensionality_reducer.fit_transform(feature_matrix_scaled)
                print("✅ Using PCA for dimensionality reduction")
        else:
            embeddings_matrix = feature_matrix_scaled
            
        # 6. Create user embeddings dictionary
        user_embeddings = {}
        for i, user_id in enumerate(user_ids):
            user_embeddings[user_id] = embeddings_matrix[i]
            
        self.is_fitted = True
        
        print(f"🎯 Generated {self.embedding_dim}-dimensional embeddings for {len(user_embeddings)} users")
        
        return user_embeddings
    
    def transform_user(self, transactions_df: pd.DataFrame, user_id: str) -> np.ndarray:
        """
        Transform single user to embedding space
        
        Args:
            transactions_df: DataFrame with user transactions
            user_id: Target user ID
            
        Returns:
            Embedding vector for the user
        """
        
        if not self.is_fitted:
            raise ValueError("Model must be fitted before transforming new users")
            
        # Extract features for this user
        features = self._extract_comprehensive_features(transactions_df, user_id)
        feature_vector = np.array(list(features.values())).reshape(1, -1)
        
        # Scale features
        feature_vector_scaled = self.scaler.transform(feature_vector)
        
        # Reduce dimensionality
        if self.dimensionality_reducer is not None:
            embedding = self.dimensionality_reducer.transform(feature_vector_scaled)
            return embedding.flatten()
        else:
            return feature_vector_scaled.flatten()
    
    def _extract_comprehensive_features(self, df: pd.DataFrame, user_id: str) -> Dict[str, float]:
        """Extract comprehensive behavioral features for a user"""
        
        user_txns = df[df['user_id'] == user_id].copy()
        
        if len(user_txns) == 0:
            return self._default_behavioral_features()
            
        features = {}
        
        # 1. Basic spending statistics
        features.update(self._basic_spending_features(user_txns))
        
        # 2. Category preferences and diversity
        features.update(self._category_behavior_features(user_txns))
        
        # 3. Merchant loyalty and diversity
        features.update(self._merchant_behavior_features(user_txns))
        
        # 4. Temporal behavior patterns
        features.update(self._temporal_behavior_features(user_txns))
        
        # 5. Risk and anomaly indicators
        features.update(self._risk_behavior_features(user_txns))
        
        # 6. Lifestyle and demographic proxies
        features.update(self._lifestyle_features(user_txns))
        
        return features
    
    def _basic_spending_features(self, user_txns: pd.DataFrame) -> Dict[str, float]:
        """Basic spending pattern features"""
        features = {}
        
        amounts = user_txns['amount']
        
        # Central tendencies
        features['mean_amount'] = amounts.mean()
        features['median_amount'] = amounts.median()
        features['std_amount'] = amounts.std()
        features['min_amount'] = amounts.min()
        features['max_amount'] = amounts.max()
        
        # Distribution shape
        features['amount_skewness'] = amounts.skew()
        features['amount_kurtosis'] = amounts.kurtosis()
        
        # Percentiles
        features['amount_p25'] = amounts.quantile(0.25)
        features['amount_p75'] = amounts.quantile(0.75)
        features['amount_p90'] = amounts.quantile(0.90)
        features['amount_p95'] = amounts.quantile(0.95)
        
        # Variability measures
        features['coefficient_of_variation'] = amounts.std() / amounts.mean() if amounts.mean() > 0 else 0
        features['interquartile_range'] = features['amount_p75'] - features['amount_p25']
        
        # Transaction count features
        features['total_transactions'] = len(user_txns)
        features['total_spending'] = amounts.sum()
        
        return features
    
    def _category_behavior_features(self, user_txns: pd.DataFrame) -> Dict[str, float]:
        """Category preference and diversity features"""
        features = {}
        
        category_spending = user_txns.groupby('category')['amount'].agg(['sum', 'count', 'mean'])
        total_spending = user_txns['amount'].sum()
        total_txns = len(user_txns)
        
        # Category diversity
        n_categories = len(category_spending)
        features['category_diversity'] = n_categories
        
        # Category concentration (Gini coefficient)
        category_proportions = category_spending['sum'] / total_spending
        category_proportions_sorted = np.sort(category_proportions)
        n = len(category_proportions_sorted)
        index = np.arange(1, n + 1)
        gini = (2 * np.sum(index * category_proportions_sorted)) / (n * np.sum(category_proportions_sorted)) - (n + 1) / n
        features['category_concentration_gini'] = gini
        
        # Entropy of category distribution
        category_entropy = -np.sum(category_proportions * np.log2(category_proportions + 1e-10))
        features['category_entropy'] = category_entropy
        
        # Dominant category features
        dominant_category = category_spending['sum'].idxmax()
        features['dominant_category_ratio'] = category_spending.loc[dominant_category, 'sum'] / total_spending
        features['dominant_category_avg_amount'] = category_spending.loc[dominant_category, 'mean']
        
        # Category-specific ratios (for known categories)
        known_categories = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'health', 'education']
        for cat in known_categories:
            if cat in category_spending.index:
                features[f'{cat}_spending_ratio'] = category_spending.loc[cat, 'sum'] / total_spending
                features[f'{cat}_tx_ratio'] = category_spending.loc[cat, 'count'] / total_txns
                features[f'{cat}_avg_amount'] = category_spending.loc[cat, 'mean']
            else:
                features[f'{cat}_spending_ratio'] = 0.0
                features[f'{cat}_tx_ratio'] = 0.0
                features[f'{cat}_avg_amount'] = 0.0
        
        return features
    
    def _merchant_behavior_features(self, user_txns: pd.DataFrame) -> Dict[str, float]:
        """Merchant loyalty and diversity features"""
        features = {}
        
        merchant_stats = user_txns.groupby('merchant')['amount'].agg(['sum', 'count', 'mean'])
        total_spending = user_txns['amount'].sum()
        total_txns = len(user_txns)
        
        # Merchant diversity
        n_merchants = len(merchant_stats)
        features['merchant_diversity'] = n_merchants
        features['merchants_per_transaction'] = n_merchants / total_txns
        
        # Merchant loyalty (repeat visits)
        repeat_merchants = (merchant_stats['count'] > 1).sum()
        features['repeat_merchant_ratio'] = repeat_merchants / n_merchants if n_merchants > 0 else 0
        
        # Merchant concentration
        merchant_proportions = merchant_stats['sum'] / total_spending
        merchant_entropy = -np.sum(merchant_proportions * np.log2(merchant_proportions + 1e-10))
        features['merchant_entropy'] = merchant_entropy
        
        # Top merchant features
        top_merchant = merchant_stats['sum'].idxmax()
        features['top_merchant_spending_ratio'] = merchant_stats.loc[top_merchant, 'sum'] / total_spending
        features['top_merchant_visit_count'] = merchant_stats.loc[top_merchant, 'count']
        features['top_merchant_avg_amount'] = merchant_stats.loc[top_merchant, 'mean']
        
        # Merchant exploration tendency
        single_visit_merchants = (merchant_stats['count'] == 1).sum()
        features['exploration_ratio'] = single_visit_merchants / n_merchants if n_merchants > 0 else 0
        
        return features
    
    def _temporal_behavior_features(self, user_txns: pd.DataFrame) -> Dict[str, float]:
        """Temporal behavior pattern features"""
        features = {}
        
        if 'timestamp' not in user_txns.columns:
            return features
            
        user_txns['timestamp'] = pd.to_datetime(user_txns['timestamp'])
        user_txns['hour'] = user_txns['timestamp'].dt.hour
        user_txns['day_of_week'] = user_txns['timestamp'].dt.dayofweek
        user_txns['day_of_month'] = user_txns['timestamp'].dt.day
        
        # Time of day preferences
        hour_distribution = user_txns['hour'].value_counts(normalize=True)
        features['hour_entropy'] = -np.sum(hour_distribution * np.log2(hour_distribution + 1e-10))
        
        # Peak hours
        peak_hour = user_txns['hour'].mode().iloc[0] if len(user_txns['hour'].mode()) > 0 else 12
        features['peak_hour'] = peak_hour
        features['peak_hour_ratio'] = (user_txns['hour'] == peak_hour).mean()
        
        # Day of week patterns
        dow_distribution = user_txns['day_of_week'].value_counts(normalize=True)
        features['dow_entropy'] = -np.sum(dow_distribution * np.log2(dow_distribution + 1e-10))
        
        # Weekend vs weekday behavior
        weekend_txns = user_txns[user_txns['day_of_week'].isin([5, 6])]
        features['weekend_transaction_ratio'] = len(weekend_txns) / len(user_txns)
        features['weekend_spending_ratio'] = weekend_txns['amount'].sum() / user_txns['amount'].sum()
        
        # Monthly distribution
        monthly_distribution = user_txns['day_of_month'].value_counts(normalize=True)
        features['monthly_entropy'] = -np.sum(monthly_distribution * np.log2(monthly_distribution + 1e-10))
        
        # Transaction timing regularity
        user_txns_sorted = user_txns.sort_values('timestamp')
        time_diffs = user_txns_sorted['timestamp'].diff().dt.total_seconds() / 3600  # hours
        time_diffs = time_diffs.dropna()
        
        if len(time_diffs) > 0:
            features['avg_time_between_txns'] = time_diffs.mean()
            features['time_between_txns_std'] = time_diffs.std()
            features['time_regularity'] = time_diffs.std() / time_diffs.mean() if time_diffs.mean() > 0 else 0
        else:
            features['avg_time_between_txns'] = 0
            features['time_between_txns_std'] = 0
            features['time_regularity'] = 0
        
        return features
    
    def _risk_behavior_features(self, user_txns: pd.DataFrame) -> Dict[str, float]:
        """Risk and anomaly indicator features"""
        features = {}
        
        amounts = user_txns['amount']
        
        # Large transaction indicators
        q95 = amounts.quantile(0.95)
        large_txns = amounts[amounts > q95]
        features['large_transaction_ratio'] = len(large_txns) / len(amounts)
        features['large_transaction_amount_ratio'] = large_txns.sum() / amounts.sum()
        
        # Burst activity (multiple transactions in short time)
        if 'timestamp' in user_txns.columns:
            user_txns_sorted = user_txns.sort_values('timestamp')
            time_diffs = user_txns_sorted['timestamp'].diff().dt.total_seconds() / 60  # minutes
            burst_txns = (time_diffs < 60).sum()  # transactions within 1 hour
            features['burst_activity_ratio'] = burst_txns / len(user_txns)
        else:
            features['burst_activity_ratio'] = 0
        
        # Round number preference (potential indicator)
        round_amounts = amounts[amounts % 10 == 0]
        features['round_number_ratio'] = len(round_amounts) / len(amounts)
        
        # Unusual amount patterns
        features['amount_outlier_ratio'] = self._calculate_outlier_ratio(amounts)
        
        return features
    
    def _lifestyle_features(self, user_txns: pd.DataFrame) -> Dict[str, float]:
        """Lifestyle and demographic proxy features"""
        features = {}
        
        # Spending power indicators
        amounts = user_txns['amount']
        features['spending_power_score'] = np.log1p(amounts.sum()) * np.log1p(amounts.mean())
        
        # Luxury vs necessity ratio
        if 'category' in user_txns.columns:
            luxury_categories = ['entertainment', 'shopping', 'dining']
            necessity_categories = ['food', 'transport', 'bills', 'health']
            
            luxury_spending = user_txns[user_txns['category'].isin(luxury_categories)]['amount'].sum()
            necessity_spending = user_txns[user_txns['category'].isin(necessity_categories)]['amount'].sum()
            
            total_spending = amounts.sum()
            features['luxury_ratio'] = luxury_spending / total_spending if total_spending > 0 else 0
            features['necessity_ratio'] = necessity_spending / total_spending if total_spending > 0 else 0
            features['luxury_necessity_balance'] = features['luxury_ratio'] / (features['necessity_ratio'] + 1e-10)
        
        # Transaction size consistency (lifestyle stability indicator)
        features['lifestyle_stability'] = 1 / (1 + amounts.std() / amounts.mean()) if amounts.mean() > 0 else 0
        
        return features
    
    def _calculate_outlier_ratio(self, amounts: pd.Series) -> float:
        """Calculate ratio of outlier transactions using IQR method"""
        Q1 = amounts.quantile(0.25)
        Q3 = amounts.quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        outliers = amounts[(amounts < lower_bound) | (amounts > upper_bound)]
        return len(outliers) / len(amounts)
    
    def _default_behavioral_features(self) -> Dict[str, float]:
        """Return default features for users with no data"""
        return {
            'mean_amount': 0.0, 'median_amount': 0.0, 'std_amount': 0.0,
            'category_diversity': 0.0, 'merchant_diversity': 0.0,
            'weekend_transaction_ratio': 0.0, 'large_transaction_ratio': 0.0,
            'spending_power_score': 0.0, 'lifestyle_stability': 0.0,
            'category_entropy': 0.0, 'merchant_entropy': 0.0
        }
    
    def get_user_cluster(self, embedding: np.ndarray) -> int:
        """Get cluster assignment for user embedding"""
        if not self.is_fitted:
            raise ValueError("Model must be fitted first")
        return self.user_clusterer.predict(embedding.reshape(1, -1))[0]
    
    def find_similar_users(self, target_embedding: np.ndarray, all_embeddings: Dict[str, np.ndarray], top_k: int = 5) -> List[Tuple[str, float]]:
        """Find most similar users based on embedding distance"""
        similarities = []
        
        for user_id, embedding in all_embeddings.items():
            # Cosine similarity
            similarity = np.dot(target_embedding, embedding) / (np.linalg.norm(target_embedding) * np.linalg.norm(embedding))
            similarities.append((user_id, similarity))
        
        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities[:top_k]

def demo_behavioral_embeddings():
    """Demo the behavioral embedding system"""
    
    # Create sample transaction data
    np.random.seed(42)
    
    sample_data = []
    users = ['user_001', 'user_002', 'user_003']
    categories = ['food', 'transport', 'shopping', 'entertainment', 'bills']
    merchants = [f'merchant_{i}' for i in range(1, 21)]
    
    base_date = pd.Timestamp.now() - pd.Timedelta(days=90)
    
    for user in users:
        # Each user has different behavior patterns
        user_prefs = {
            'user_001': {'categories': ['food', 'transport'], 'avg_amount': 50, 'frequency': 30},
            'user_002': {'categories': ['shopping', 'entertainment'], 'avg_amount': 150, 'frequency': 20},
            'user_003': {'categories': ['bills', 'food'], 'avg_amount': 80, 'frequency': 25}
        }
        
        prefs = user_prefs[user]
        
        for i in range(prefs['frequency']):
            sample_data.append({
                'user_id': user,
                'amount': np.random.lognormal(np.log(prefs['avg_amount']), 0.5),
                'timestamp': base_date + pd.Timedelta(days=np.random.randint(0, 90), 
                                                      hours=np.random.randint(8, 22)),
                'category': np.random.choice(prefs['categories']),
                'merchant': np.random.choice(merchants)
            })
    
    df = pd.DataFrame(sample_data)
    
    # Create behavioral embeddings
    embedding_model = BehavioralEmbeddings(embedding_dim=16)
    user_embeddings = embedding_model.fit_transform(df)
    
    print("🧠 Behavioral Embeddings Generated:")
    print(f"📊 Embedding dimension: {embedding_model.embedding_dim}")
    print(f"👥 Number of users: {len(user_embeddings)}")
    
    print("\n🎯 User Embeddings:")
    for user_id, embedding in user_embeddings.items():
        print(f"  {user_id}: [{', '.join([f'{x:.3f}' for x in embedding[:5]])}...]")
    
    # Find similar users
    target_user = 'user_001'
    similar_users = embedding_model.find_similar_users(
        user_embeddings[target_user], 
        user_embeddings, 
        top_k=3
    )
    
    print(f"\n🔍 Users similar to {target_user}:")
    for user_id, similarity in similar_users:
        print(f"  {user_id}: {similarity:.4f}")
    
    print(f"\n✅ Behavioral embedding system ready!")
    return user_embeddings

if __name__ == "__main__":
    demo_behavioral_embeddings()
