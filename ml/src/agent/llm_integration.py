"""
LLM Integration Options for Financial Copilot
Tích hợp với các LLM services: OpenAI, Claude, Local models
"""

import asyncio
import aiohttp
import json
from typing import Dict, List, Optional, Any
from abc import ABC, abstractmethod

class LLMProvider(ABC):
    """Abstract base class for LLM providers"""
    
    @abstractmethod
    async def generate_response(self, prompt: str, context: Dict) -> str:
        pass

class OpenAIProvider(LLMProvider):
    """OpenAI GPT integration"""
    
    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.openai.com/v1/chat/completions"
    
    async def generate_response(self, prompt: str, context: Dict) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        messages = [
            {
                "role": "system", 
                "content": self._create_system_prompt()
            },
            {
                "role": "user",
                "content": f"Dữ liệu phân tích: {json.dumps(context, ensure_ascii=False)}\\n\\nCâu hỏi: {prompt}"
            }
        ]
        
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 500,
            "temperature": 0.7
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.base_url, headers=headers, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    return data["choices"][0]["message"]["content"].strip()
                else:
                    raise Exception(f"OpenAI API error: {response.status}")
    
    def _create_system_prompt(self) -> str:
        return """
        Bạn là trợ lý tài chính AI thông minh cho Unity Wallet Việt Nam.
        
        Nhiệm vụ:
        - Phân tích dữ liệu tài chính từ ML models
        - Trả lời câu hỏi về chi tiêu bằng tiếng Việt tự nhiên
        - Đưa ra lời khuyên tiết kiệm thực tế
        - Cảnh báo gian lận rõ ràng
        
        Phong cách:
        - Thân thiện, dễ hiểu
        - Sử dụng số liệu cụ thể từ dữ liệu
        - Lời khuyên thiết thực cho người Việt
        - Ngắn gọn nhưng đầy đủ (max 200 từ)
        
        Luôn trả lời bằng tiếng Việt và sử dụng format tiền tệ Việt Nam.
        """

class ClaudeProvider(LLMProvider):
    """Anthropic Claude integration"""
    
    def __init__(self, api_key: str, model: str = "claude-3-sonnet-20240229"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.anthropic.com/v1/messages"
    
    async def generate_response(self, prompt: str, context: Dict) -> str:
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": self.model,
            "max_tokens": 500,
            "messages": [
                {
                    "role": "user",
                    "content": f"{self._create_system_prompt()}\\n\\nDữ liệu: {json.dumps(context, ensure_ascii=False)}\\n\\nCâu hỏi: {prompt}"
                }
            ]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.base_url, headers=headers, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    return data["content"][0]["text"].strip()
                else:
                    raise Exception(f"Claude API error: {response.status}")
    
    def _create_system_prompt(self) -> str:
        return """
        Bạn là chuyên gia tài chính AI cho Unity Wallet.
        Hãy phân tích dữ liệu và trả lời bằng tiếng Việt một cách thân thiện, chính xác.
        Đưa ra lời khuyên thực tế dựa trên dữ liệu ML đã phân tích.
        """

class LocalLLMProvider(LLMProvider):
    """Local LLM integration (Ollama, Hugging Face)"""
    
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama2"):
        self.base_url = base_url
        self.model = model
    
    async def generate_response(self, prompt: str, context: Dict) -> str:
        # For Ollama
        endpoint = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.model,
            "prompt": self._create_full_prompt(prompt, context),
            "stream": False
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(endpoint, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("response", "").strip()
                else:
                    raise Exception(f"Local LLM error: {response.status}")
    
    def _create_full_prompt(self, prompt: str, context: Dict) -> str:
        return f"""
        Bạn là trợ lý tài chính AI thông minh.
        
        Dữ liệu phân tích ML:
        {json.dumps(context, ensure_ascii=False, indent=2)}
        
        Câu hỏi của người dùng: {prompt}
        
        Hãy trả lời bằng tiếng Việt, dựa trên dữ liệu trên. Giữ câu trả lời ngắn gọn và hữu ích.
        
        Trả lời:
        """

class VietnameseLLMProvider(LLMProvider):
    """Vietnamese-specific LLM (VinAI, FPT.AI)"""
    
    def __init__(self, api_key: str, provider: str = "fpt"):
        self.api_key = api_key
        self.provider = provider
        
        if provider == "fpt":
            self.base_url = "https://api.fpt.ai/hmi/tts/v5"
        elif provider == "vinai":
            self.base_url = "https://api.vinai.io/v1/chat"
    
    async def generate_response(self, prompt: str, context: Dict) -> str:
        if self.provider == "fpt":
            return await self._fpt_generate(prompt, context)
        elif self.provider == "vinai":
            return await self._vinai_generate(prompt, context)
    
    async def _fpt_generate(self, prompt: str, context: Dict) -> str:
        # FPT.AI implementation
        headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        # Simplified for demo - actual FPT.AI would have different format
        payload = {
            "text": self._create_vietnamese_prompt(prompt, context),
            "voice": "banmai",
            "format": "json"
        }
        
        # This is a simplified example
        return f"Dựa trên phân tích ML, {self._generate_fallback_vietnamese(context)}"
    
    def _create_vietnamese_prompt(self, prompt: str, context: Dict) -> str:
        return f"""
        Phân tích tài chính:
        - Tổng chi tiêu: {context.get('total_amount', 0):,} VND
        - Số giao dịch: {context.get('transaction_count', 0)}
        
        Câu hỏi: {prompt}
        
        Trả lời một cách tự nhiên bằng tiếng Việt.
        """
    
    def _generate_fallback_vietnamese(self, context: Dict) -> str:
        """Fallback Vietnamese response"""
        
        if "total_amount" in context:
            return f"tổng chi tiêu của bạn là {context['total_amount']:,} VND. Tôi có thể giúp bạn phân tích chi tiết hơn."
        
        return "tôi đang phân tích dữ liệu của bạn. Vui lòng hỏi cụ thể hơn."

class SmartLLMRouter:
    """Smart router to choose best LLM based on query type"""
    
    def __init__(self):
        self.providers = {}
        self.fallback_provider = None
    
    def add_provider(self, name: str, provider: LLMProvider, is_fallback: bool = False):
        self.providers[name] = provider
        if is_fallback:
            self.fallback_provider = provider
    
    async def generate_response(self, prompt: str, context: Dict) -> str:
        # Determine best provider based on query
        provider_name = self._select_provider(prompt)
        
        try:
            provider = self.providers.get(provider_name, self.fallback_provider)
            return await provider.generate_response(prompt, context)
        except Exception as e:
            # Fallback to simple response
            if self.fallback_provider:
                return await self.fallback_provider.generate_response(prompt, context)
            else:
                return self._generate_simple_fallback(context)
    
    def _select_provider(self, prompt: str) -> str:
        """Select best provider based on query characteristics"""
        
        prompt_lower = prompt.lower()
        
        # Complex financial analysis -> OpenAI/Claude
        if any(word in prompt_lower for word in ["phân tích", "so sánh", "dự đoán", "xu hướng"]):
            return "openai" if "openai" in self.providers else "claude"
        
        # Simple queries -> Local/Vietnamese LLM
        if any(word in prompt_lower for word in ["tóm tắt", "bao nhiêu", "có phải"]):
            return "vietnamese" if "vietnamese" in self.providers else "local"
        
        # Default to most capable
        return "openai" if "openai" in self.providers else "claude"
    
    def _generate_simple_fallback(self, context: Dict) -> str:
        """Simple rule-based fallback"""
        
        if "total_amount" in context:
            return f"Tổng chi tiêu của bạn là {context['total_amount']:,} VND. Để biết thêm chi tiết, vui lòng hỏi cụ thể hơn."
        
        return "Tôi đang xử lý yêu cầu của bạn. Vui lòng thử lại sau ít phút."

# Integration with Financial Copilot
class EnhancedFinancialCopilot:
    """Enhanced Financial Copilot with multiple LLM options"""
    
    def __init__(self, llm_config: Dict):
        self.llm_router = SmartLLMRouter()
        self._setup_llm_providers(llm_config)
    
    def _setup_llm_providers(self, config: Dict):
        """Setup LLM providers based on configuration"""
        
        # OpenAI
        if config.get("openai_api_key"):
            openai_provider = OpenAIProvider(config["openai_api_key"])
            self.llm_router.add_provider("openai", openai_provider, is_fallback=True)
        
        # Claude
        if config.get("claude_api_key"):
            claude_provider = ClaudeProvider(config["claude_api_key"])
            self.llm_router.add_provider("claude", claude_provider)
        
        # Local LLM
        if config.get("local_llm_url"):
            local_provider = LocalLLMProvider(config["local_llm_url"])
            self.llm_router.add_provider("local", local_provider)
        
        # Vietnamese LLM
        if config.get("vietnamese_api_key"):
            vietnamese_provider = VietnameseLLMProvider(config["vietnamese_api_key"])
            self.llm_router.add_provider("vietnamese", vietnamese_provider)
    
    async def chat_async(self, user_message: str, user_id: str, transactions_df) -> Dict:
        """Async chat with enhanced LLM integration"""
        
        # Get ML context (same as before)
        intent = self._analyze_intent(user_message)
        ml_context = self._get_ml_context(intent, user_id, transactions_df)
        
        # Generate LLM response using smart router
        response = await self.llm_router.generate_response(user_message, ml_context)
        
        # Add action suggestions
        actions = self._suggest_actions(intent, ml_context)
        
        return {
            "response": response,
            "intent": intent,
            "actions": actions,
            "ml_insights": ml_context,
            "timestamp": datetime.now().isoformat()
        }

# Configuration example
LLM_CONFIG_EXAMPLE = {
    "openai_api_key": "sk-...",  # OpenAI API key
    "claude_api_key": "claude-...",  # Anthropic API key
    "local_llm_url": "http://localhost:11434",  # Ollama URL
    "vietnamese_api_key": "fpt-...",  # FPT.AI key
    "fallback_mode": "rule_based"
}

if __name__ == "__main__":
    # Demo usage
    import asyncio
    
    async def demo():
        config = {
            "local_llm_url": "http://localhost:11434"  # Only local for demo
        }
        
        copilot = EnhancedFinancialCopilot(config)
        
        # Mock data
        import pandas as pd
        transactions = pd.DataFrame([
            {"user_id": "user123", "amount": 500000, "description": "ăn phở"}
        ])
        
        response = await copilot.chat_async(
            "Tóm tắt chi tiêu tháng này", 
            "user123", 
            transactions
        )
        
        print("Response:", response["response"])
    
    # asyncio.run(demo())
