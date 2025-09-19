#!/bin/bash

# UnityWallet ML Service Startup Script

echo "🚀 Starting UnityWallet ML Service..."

# Check if we're in the right directory (should be project root)
if [ ! -d "ml" ]; then
    echo "❌ Error: ml/ directory not found. Please run from project root directory"
    exit 1
fi

# Change to ml directory for dependency installation
cd ml

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

# Go back to project root and run with auto-reload for development
cd ..
python -m uvicorn ml.main:app --host 0.0.0.0 --port 8001 --reload
