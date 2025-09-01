#!/bin/bash

# 🚀 Production Deployment Script - Financial Copilot
# Unity Wallet ML - Financial Copilot Deployment

set -e

echo "🚀 Financial Copilot - Production Deployment"
echo "=============================================="

# ================== CONFIGURATION ==================
BACKEND_URL=${BACKEND_URL:-"http://localhost:8000"}
API_KEY=${API_KEY:-""}
ENVIRONMENT=${ENVIRONMENT:-"production"}
PORT=${PORT:-8001}

# ================== CHECKS ==================
echo "🔍 Pre-deployment checks..."

# Check if running as root (for system installations)
if [[ $EUID -eq 0 ]]; then
   echo "⚠️  Running as root - proceed with caution"
fi

# Check Python version
python_version=$(python3 --version 2>&1 | cut -d' ' -f2)
echo "🐍 Python version: $python_version"

# Check available RAM
total_ram=$(free -h | awk '/^Mem:/ {print $2}')
echo "💾 Available RAM: $total_ram"

if [[ $(free | awk '/^Mem:/ {print $2}') -lt 4000000 ]]; then
    echo "⚠️  Warning: Less than 4GB RAM - consider using lighter models"
fi

# ================== INSTALL DEPENDENCIES ==================
echo "📦 Installing dependencies..."

# Update system packages
if command -v apt-get &> /dev/null; then
    echo "🔄 Updating system packages..."
    sudo apt-get update -qq
    sudo apt-get install -y curl wget python3-pip python3-venv
fi

# Create virtual environment
echo "🔨 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python packages
pip install --upgrade pip
pip install -r requirements.txt

# Additional production packages
pip install gunicorn uvicorn[standard] redis prometheus-client

echo "✅ Dependencies installed"

# ================== INSTALL OLLAMA ==================
if ! command -v ollama &> /dev/null; then
    echo "🤖 Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    
    # Start Ollama service
    sudo systemctl enable ollama
    sudo systemctl start ollama
    
    # Wait for Ollama to start
    echo "⏳ Waiting for Ollama to start..."
    sleep 10
    
    # Pull required models
    echo "📥 Downloading AI models..."
    ollama pull phi3:mini
    ollama pull gemma:2b
    
    echo "✅ Ollama installed and models downloaded"
else
    echo "✅ Ollama already installed"
fi

# ================== CONFIGURATION ==================
echo "⚙️  Setting up configuration..."

# Create config file
cat > .env.production << EOF
# Financial Copilot Production Configuration
ENVIRONMENT=production
UNITY_WALLET_BACKEND_URL=$BACKEND_URL
BACKEND_API_KEY=$API_KEY
OLLAMA_URL=http://localhost:11434
DEFAULT_MODEL=phi3:mini
API_HOST=0.0.0.0
API_PORT=$PORT
LOG_LEVEL=INFO
DEBUG=False
RATE_LIMIT_REQUESTS=1000
OLLAMA_TIMEOUT=60
EOF

echo "✅ Configuration created"

# ================== NGINX SETUP (Optional) ==================
if command -v nginx &> /dev/null; then
    echo "🌐 Setting up Nginx reverse proxy..."
    
    sudo tee /etc/nginx/sites-available/financial-copilot << EOF
server {
    listen 80;
    server_name api.unitywallet.vn;  # Change to your domain
    
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/financial-copilot /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    
    echo "✅ Nginx configured"
fi

# ================== SYSTEMD SERVICE ==================
echo "🔧 Creating systemd service..."

sudo tee /etc/systemd/system/financial-copilot.service << EOF
[Unit]
Description=Financial Copilot API Server
After=network.target ollama.service
Requires=ollama.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=PATH=$(pwd)/venv/bin
EnvironmentFile=$(pwd)/.env.production
ExecStart=$(pwd)/venv/bin/gunicorn -k uvicorn.workers.UvicornWorker -c gunicorn.conf.py src.agent.api_server:app
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$(pwd)

[Install]
WantedBy=multi-user.target
EOF

# Create Gunicorn config
cat > gunicorn.conf.py << EOF
# Gunicorn configuration for Financial Copilot

bind = "0.0.0.0:$PORT"
workers = 2
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 60
keepalive = 5

# Logging
accesslog = "/var/log/financial-copilot/access.log"
errorlog = "/var/log/financial-copilot/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "financial-copilot"

# Auto-reload in development
reload = False
EOF

# Create log directory
sudo mkdir -p /var/log/financial-copilot
sudo chown $USER:$USER /var/log/financial-copilot

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable financial-copilot.service

echo "✅ Systemd service created"

# ================== FIREWALL SETUP ==================
if command -v ufw &> /dev/null; then
    echo "🔒 Configuring firewall..."
    sudo ufw allow $PORT/tcp
    echo "✅ Firewall configured"
fi

# ================== SSL SETUP (Let's Encrypt) ==================
if command -v certbot &> /dev/null && [[ -n "$DOMAIN" ]]; then
    echo "🔐 Setting up SSL with Let's Encrypt..."
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@unitywallet.vn
    echo "✅ SSL configured"
fi

# ================== MONITORING SETUP ==================
echo "📊 Setting up monitoring..."

# Create monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash

# Financial Copilot Health Monitor

check_service() {
    if systemctl is-active --quiet financial-copilot; then
        echo "✅ Financial Copilot service is running"
    else
        echo "❌ Financial Copilot service is down"
        sudo systemctl restart financial-copilot
    fi
}

check_ollama() {
    if curl -s http://localhost:11434/api/tags > /dev/null; then
        echo "✅ Ollama is running"
    else
        echo "❌ Ollama is down"
        sudo systemctl restart ollama
    fi
}

check_api() {
    if curl -s http://localhost:$PORT/health > /dev/null; then
        echo "✅ API is responding"
    else
        echo "❌ API is not responding"
    fi
}

check_disk() {
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 90 ]]; then
        echo "⚠️  Disk usage is high: ${disk_usage}%"
    else
        echo "✅ Disk usage OK: ${disk_usage}%"
    fi
}

check_memory() {
    mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [[ $mem_usage -gt 90 ]]; then
        echo "⚠️  Memory usage is high: ${mem_usage}%"
    else
        echo "✅ Memory usage OK: ${mem_usage}%"
    fi
}

echo "🔍 Financial Copilot Health Check - $(date)"
echo "================================================"
check_service
check_ollama  
check_api
check_disk
check_memory
echo ""
EOF

chmod +x monitor.sh

# Add to crontab for regular monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * $(pwd)/monitor.sh >> /var/log/financial-copilot/monitor.log 2>&1") | crontab -

echo "✅ Monitoring setup complete"

# ================== START SERVICES ==================
echo "🚀 Starting Financial Copilot..."

# Start services
sudo systemctl start ollama
sleep 5
sudo systemctl start financial-copilot

# Wait for startup
echo "⏳ Waiting for services to start..."
sleep 10

# ================== VERIFICATION ==================
echo "🔍 Verifying deployment..."

# Check Ollama
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running"
else
    echo "❌ Ollama failed to start"
    exit 1
fi

# Check API
if curl -s http://localhost:$PORT/health > /dev/null; then
    echo "✅ Financial Copilot API is running"
else
    echo "❌ API failed to start"
    exit 1
fi

# Test model
echo "🧠 Testing AI model..."
response=$(curl -s -X POST http://localhost:$PORT/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Xin chào","user_id":"test"}' | jq -r '.response')

if [[ -n "$response" && "$response" != "null" ]]; then
    echo "✅ AI model is working"
    echo "📝 Test response: $response"
else
    echo "❌ AI model test failed"
fi

# ================== COMPLETION ==================
echo ""
echo "🎉 Financial Copilot deployment completed!"
echo "=========================================="
echo "🌐 API URL: http://localhost:$PORT"
echo "📚 Documentation: http://localhost:$PORT/docs"
echo "❤️  Health Check: http://localhost:$PORT/health"
echo ""
echo "📋 Management Commands:"
echo "  Start:   sudo systemctl start financial-copilot"
echo "  Stop:    sudo systemctl stop financial-copilot"
echo "  Restart: sudo systemctl restart financial-copilot"
echo "  Status:  sudo systemctl status financial-copilot"
echo "  Logs:    sudo journalctl -u financial-copilot -f"
echo ""
echo "🔧 Configuration file: .env.production"
echo "📊 Monitor: ./monitor.sh"
echo ""

# Configuration reminder
if [[ "$BACKEND_URL" == "http://localhost:8000" ]]; then
    echo "⚠️  REMINDER: Update BACKEND_URL in .env.production"
fi

if [[ -z "$API_KEY" ]]; then
    echo "⚠️  REMINDER: Set BACKEND_API_KEY in .env.production"
fi

echo "🚀 Financial Copilot is ready for production!"
