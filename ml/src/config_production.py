# 🔧 Configuration File - Financial Copilot

import os
from typing import Dict, Any, Optional

class Config:
    """Configuration settings for Financial Copilot"""
    
    # ================== BACKEND URLS ==================
    UNITY_WALLET_BACKEND_URL = os.getenv(
        'UNITY_WALLET_BACKEND_URL', 
        'http://localhost:8000'  # Change this to your Unity Wallet backend URL
    )
    
    BACKEND_API_KEY = os.getenv(
        'BACKEND_API_KEY', 
        'your-backend-api-key'  # Add your actual API key here
    )
    
    # ================== OLLAMA SETTINGS ==================
    OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434')
    
    # Model preferences (fastest to slowest)
    MODELS = {
        'fast': 'gemma:2b',       # Fast responses, good for quick questions
        'balanced': 'phi3:mini',  # Balanced speed/quality
        'quality': 'llama3:8b'    # Best quality (if you have RAM)
    }
    
    DEFAULT_MODEL = os.getenv('DEFAULT_MODEL', 'phi3:mini')
    
    # ================== API SERVER SETTINGS ==================
    API_HOST = os.getenv('API_HOST', '0.0.0.0')
    API_PORT = int(os.getenv('API_PORT', 8001))
    
    # CORS settings
    CORS_ORIGINS = [
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://localhost:8080",  # Vue dev server
        "https://app.unitywallet.vn",  # Production frontend
        "https://unitywallet.vn"
    ]
    
    # ================== TIMEOUTS & LIMITS ==================
    OLLAMA_TIMEOUT = int(os.getenv('OLLAMA_TIMEOUT', 60))  # seconds
    MAX_CONTEXT_LENGTH = int(os.getenv('MAX_CONTEXT_LENGTH', 4000))  # tokens
    MAX_RESPONSE_LENGTH = int(os.getenv('MAX_RESPONSE_LENGTH', 1000))  # tokens
    
    # Rate limiting
    RATE_LIMIT_REQUESTS = int(os.getenv('RATE_LIMIT_REQUESTS', 100))  # per minute
    RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', 60))  # seconds
    
    # ================== ML MODELS SETTINGS ==================
    ML_MODEL_THRESHOLD = {
        'anomaly': 0.7,
        'credit_risk': 0.6,
        'spending_risk': 0.5
    }
    
    # ================== VIETNAMESE LANGUAGE SETTINGS ==================
    LANGUAGE = os.getenv('LANGUAGE', 'vi')  # Vietnamese by default
    
    VIETNAMESE_PROMPTS = {
        'system': """Bạn là Financial Copilot của Unity Wallet - trợ lý tài chính AI thông minh.

Vai trò của bạn:
- 💡 Phân tích thông minh chi tiêu và tài chính cá nhân
- 🔍 Phát hiện giao dịch bất thường và gian lận
- 💰 Tư vấn tiết kiệm và đầu tư phù hợp
- 📊 Đưa ra insights từ dữ liệu tài chính thực tế
- 🎯 Gợi ý hành động cụ thể với 1-tap actions

Nguyên tắc trả lời:
- Sử dụng tiếng Việt tự nhiên, thân thiện
- Luôn đưa ra gợi ý hành động cụ thể
- Sử dụng emoji phù hợp
- Dựa trên dữ liệu thật từ Unity Wallet
- Trả lời ngắn gọn, súc tích nhưng hữu ích""",
        
        'user_greeting': "Xin chào! Tôi có thể hỗ trợ gì về tài chính cho bạn hôm nay?",
        
        'context_prefix': "Dựa trên dữ liệu tài chính của bạn:",
        
        'suggestions_prefix': "Gợi ý hành động:",
        
        'error_message': "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại sau.",
        
        'no_data_message': "Hiện tại chưa có đủ dữ liệu để phân tích. Hãy thực hiện thêm giao dịch nhé!"
    }
    
    # ================== BACKEND API ENDPOINTS ==================
    API_ENDPOINTS = {
        'transactions': '/api/v1/transactions',
        'balance': '/api/v1/accounts/balance',
        'spending_analytics': '/api/v1/analytics/spending',
        'fraud_alerts': '/api/v1/security/fraud-alerts',
        'credit_score': '/api/v1/credit/score',
        'budgets': '/api/v1/budgets',
        'savings_goals': '/api/v1/savings/goals',
        'user_profile': '/api/v1/users/profile',
        'notifications': '/api/v1/notifications'
    }
    
    # ================== LOGGING SETTINGS ==================
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', '/tmp/financial_copilot.log')
    
    # ================== REDIS CACHE (Optional) ==================
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_TTL = int(os.getenv('CACHE_TTL', 300))  # 5 minutes
    
    # ================== ENVIRONMENT DETECTION ==================
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    
    @classmethod
    def is_production(cls) -> bool:
        return cls.ENVIRONMENT == 'production'
    
    @classmethod
    def is_development(cls) -> bool:
        return cls.ENVIRONMENT == 'development'
    
    # ================== VALIDATION ==================
    @classmethod
    def validate_config(cls) -> Dict[str, Any]:
        """Validate configuration and return status"""
        issues = []
        
        # Check required settings
        if cls.UNITY_WALLET_BACKEND_URL == 'http://localhost:8000':
            issues.append("❌ UNITY_WALLET_BACKEND_URL chưa được cấu hình")
        
        if cls.BACKEND_API_KEY == 'your-backend-api-key':
            issues.append("❌ BACKEND_API_KEY chưa được cấu hình")
        
        # Check Ollama connection
        try:
            import requests
            response = requests.get(f"{cls.OLLAMA_URL}/api/tags", timeout=5)
            if response.status_code != 200:
                issues.append("❌ Không thể kết nối Ollama")
        except:
            issues.append("❌ Ollama không khả dụng")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'config': {
                'backend_url': cls.UNITY_WALLET_BACKEND_URL,
                'ollama_url': cls.OLLAMA_URL,
                'default_model': cls.DEFAULT_MODEL,
                'environment': cls.ENVIRONMENT,
                'debug': cls.DEBUG
            }
        }

# ================== DEVELOPMENT CONFIG ==================
class DevelopmentConfig(Config):
    DEBUG = True
    LOG_LEVEL = 'DEBUG'
    OLLAMA_TIMEOUT = 30
    
    # Use local mock backend for development
    UNITY_WALLET_BACKEND_URL = 'http://localhost:8000'

# ================== PRODUCTION CONFIG ==================  
class ProductionConfig(Config):
    DEBUG = False
    LOG_LEVEL = 'WARNING'
    OLLAMA_TIMEOUT = 60
    
    # Production backend URL
    UNITY_WALLET_BACKEND_URL = 'https://api.unitywallet.vn'
    
    # Enhanced security
    CORS_ORIGINS = [
        "https://app.unitywallet.vn",
        "https://unitywallet.vn"
    ]

# ================== CONFIG FACTORY ==================
def get_config() -> Config:
    """Get configuration based on environment"""
    env = os.getenv('ENVIRONMENT', 'development')
    
    if env == 'production':
        return ProductionConfig()
    else:
        return DevelopmentConfig()

# ================== QUICK SETUP HELPER ==================
def setup_config():
    """Quick setup helper for first-time users"""
    print("🚀 Financial Copilot - Quick Setup")
    print("=" * 50)
    
    config = get_config()
    validation = config.validate_config()
    
    print(f"📊 Environment: {config.ENVIRONMENT}")
    print(f"🔧 Backend URL: {config.UNITY_WALLET_BACKEND_URL}")
    print(f"🤖 Ollama URL: {config.OLLAMA_URL}")
    print(f"🧠 Default Model: {config.DEFAULT_MODEL}")
    
    if validation['valid']:
        print("\n✅ Configuration is valid!")
    else:
        print("\n⚠️ Configuration issues:")
        for issue in validation['issues']:
            print(f"  {issue}")
        
        print("\n🔧 To fix:")
        print("1. Set environment variables:")
        print("   export UNITY_WALLET_BACKEND_URL='http://your-backend:8000'")
        print("   export BACKEND_API_KEY='your-api-key'")
        print("\n2. Ensure Ollama is running:")
        print("   ollama serve")
        print("   ollama pull phi3:mini")
    
    return validation

if __name__ == "__main__":
    # Quick config check
    setup_config()
