#!/bin/bash
# Unity Wallet ML Pipeline - Quick Test Runner
# Starts API server and runs comprehensive tests

echo "🚀 Unity Wallet ML Pipeline - Test Runner"
echo "=========================================="

# Check if virtual environment is activated
if [[ "$VIRTUAL_ENV" != *"hdbank-ml"* ]]; then
    echo "⚠️  Activating virtual environment..."
    source ~/.venvs/hdbank-ml/bin/activate
fi

# Check if API server is already running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ API server is already running"
    RUN_TESTS=true
else
    echo "🔄 Starting API server..."
    
    # Start API server in background
    nohup uvicorn src.api.service:app --host 0.0.0.0 --port 8000 > api_server.log 2>&1 &
    API_PID=$!
    
    echo "⏳ Waiting for API server to start..."
    
    # Wait for server to be ready (max 30 seconds)
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo "✅ API server started (PID: $API_PID)"
            RUN_TESTS=true
            break
        fi
        echo "   Waiting... ($i/30)"
        sleep 1
    done
    
    if [ "$RUN_TESTS" != "true" ]; then
        echo "❌ Failed to start API server"
        exit 1
    fi
fi

echo ""
echo "🧪 Running comprehensive test suite..."
echo "======================================"

# Run the test suite
python test_ml_pipeline.py

echo ""
echo "📊 Test completed! Check results above."

# Option to stop server
if [ ! -z "$API_PID" ]; then
    echo ""
    read -p "❓ Stop API server? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $API_PID
        echo "🛑 API server stopped"
    else
        echo "🔄 API server still running (PID: $API_PID)"
        echo "   Use 'kill $API_PID' to stop manually"
    fi
fi
