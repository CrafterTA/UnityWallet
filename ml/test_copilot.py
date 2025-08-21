#!/usr/bin/env python3
"""
Simple test cho Financial Copilot
"""

import pandas as pd
from src.agent.financial_copilot_complete import FinancialCopilot
import time

def test_basic_functionality():
    """Test basic functionality"""
    print("🚀 Testing Financial Copilot Basic Functions")
    print("=" * 50)
    
    # Initialize
    copilot = FinancialCopilot(optimize_for_nitro5=True)
    
    # Check models
    models = copilot._get_ollama_models()
    print(f"📦 Available models: {models}")
    
    if not models:
        print("❌ No models available. Please install: ollama pull phi3:mini")
        return
    
    # Test data
    transactions = pd.DataFrame([
        {"amount": 100000, "description": "Ăn sáng", "merchant": "Phở Hồng"},
        {"amount": 50000, "description": "Cafe", "merchant": "Highlands"},
        {"amount": 2000000, "description": "Mua điện thoại", "merchant": "Thế Giới Di Động"}
    ])
    
    print("\\n📊 Sample transactions:")
    print(transactions.to_string())
    
    # Test simple query first
    print("\\n🧪 Test 1: Simple Query")
    simple_prompt = "Tôi đã chi bao nhiêu tiền?"
    
    try:
        start = time.time()
        
        # Build simple prompt manually for testing
        context = copilot._get_ml_context('simple_queries', 'test_user', transactions)
        prompt = f"""
        Bạn là trợ lý tài chính AI. 
        Dữ liệu: Tổng chi tiêu = {transactions['amount'].sum():,.0f} VND
        Câu hỏi: {simple_prompt}
        Trả lời ngắn gọn bằng tiếng Việt.
        """
        
        model = "phi3:mini"
        response = copilot._ollama_chat(model, prompt)
        elapsed = time.time() - start
        
        print(f"⏱️  Time: {elapsed:.2f}s")
        print(f"🤖 Model: {model}")
        print(f"💬 Response: {response}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

def test_interactive_mode():
    """Test interactive mode"""
    print("\\n🎮 Interactive Test Mode")
    print("Type 'exit' to quit")
    
    copilot = FinancialCopilot()
    
    # Sample data
    transactions = pd.DataFrame([
        {"amount": 100000, "description": "Ăn trưa", "merchant": "Quán Cơm"},
        {"amount": 50000, "description": "Cafe", "merchant": "Starbucks"}
    ])
    
    while True:
        try:
            user_input = input("\\n👤 Bạn: ").strip()
            if user_input.lower() in ['exit', 'quit', 'thoát']:
                print("👋 Tạm biệt!")
                break
                
            if not user_input:
                continue
                
            start = time.time()
            result = copilot.chat(user_input, "test_user", transactions)
            elapsed = time.time() - start
            
            print(f"🤖 Copilot ({elapsed:.1f}s): {result['response']}")
            
            if result.get('suggestions'):
                print("💡 Gợi ý:")
                for suggestion in result['suggestions']:
                    print(f"  • {suggestion}")
                    
        except KeyboardInterrupt:
            print("\\n👋 Tạm biệt!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_basic_functionality()
    
    # Ask if user wants interactive mode
    response = input("\\n❓ Bạn có muốn test interactive mode? (y/n): ")
    if response.lower() in ['y', 'yes', 'có']:
        test_interactive_mode()
