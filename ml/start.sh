#!/bin/bash

# UnityWallet ML Service Startup Script

echo "🚀 Starting UnityWallet ML Service..."

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: main.py not found. Please run from ml/ directory"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file..."
    cp .env.example .env
    echo "💡 Please edit .env file if needed"
fi

# Start the service
echo "🎯 Starting ML Service on port 8001..."
echo "📖 API Documentation will be available at: http://localhost:8001/docs"
echo "🛑 Press Ctrl+C to stop the service"
echo ""

# Run with auto-reload for development
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
