#!/bin/bash
"""
Setup script cho Financial Copilot trên Acer Nitro 5
Cài đặt Ollama và download recommended models
"""

echo "🚀 Setting up Financial Copilot for Acer Nitro 5"
echo "================================================"

# Check if Ollama is already installed
if command -v ollama &> /dev/null; then
    echo "✅ Ollama đã được cài đặt"
else
    echo "📥 Đang cài đặt Ollama..."
    
    # Install Ollama for Linux
    curl -fsSL https://ollama.com/install.sh | sh
    
    if [ $? -eq 0 ]; then
        echo "✅ Ollama đã được cài đặt thành công"
    else
        echo "❌ Lỗi cài đặt Ollama"
        exit 1
    fi
fi

# Start Ollama service
echo "🔧 Đang khởi động Ollama service..."
systemctl --user enable ollama
systemctl --user start ollama

# Wait for Ollama to start
sleep 5

# Download recommended models for Nitro 5
echo "📦 Đang download models tối ưu cho Nitro 5..."

models=("phi3:mini" "gemma:2b")

for model in "${models[@]}"; do
    echo "⬇️  Downloading $model..."
    ollama pull $model
    
    if [ $? -eq 0 ]; then
        echo "✅ $model downloaded successfully"
    else
        echo "⚠️  Failed to download $model"
    fi
done

# Optional: Download Llama 3 8B if enough RAM
echo "🧠 Checking system RAM..."
ram_gb=$(free -g | awk '/^Mem:/{print $2}')

if [ $ram_gb -ge 16 ]; then
    echo "💾 RAM: ${ram_gb}GB - Downloading Llama 3 8B..."
    ollama pull llama3:8b
    echo "✅ Llama 3 8B downloaded (high quality option)"
else
    echo "💾 RAM: ${ram_gb}GB - Skipping Llama 3 8B (requires 16GB+)"
fi

# Test installation
echo "🧪 Testing Financial Copilot..."
ollama list

echo ""
echo "🎯 SETUP COMPLETE!"
echo "===================="
echo "✅ Ollama service running"
echo "✅ Models downloaded:"
ollama list | grep -E "(phi3|gemma|llama3)"

echo ""
echo "🚀 Start Financial Copilot:"
echo "cd /home/thaianh/Workspace/UnityWallet/ml"
echo "python src/agent/financial_copilot_complete.py"
echo ""
echo "💬 Interactive mode:"
echo "python -c \"from src.agent.financial_copilot_complete import FinancialCopilot; FinancialCopilot().chat_interactive()\""
