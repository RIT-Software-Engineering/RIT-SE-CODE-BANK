#!/bin/bash
set -e

echo "🚀 Deploying TA Portal to apps-staging.se.rit.edu..."

# Configuration
VM_HOST="${DEPLOY_HOST:-apps-staging.se.rit.edu}"
VM_USER="${DEPLOY_USER:-kc8563}"
DEPLOY_PATH="/opt/ta-portal"
BRANCH="${GITHUB_REF##*/}"

# SSH and deploy
ssh "${VM_USER}@${VM_HOST}" << 'ENDSSH'
    set -e
    
    echo "📂 Navigating to deployment directory..."
    cd /opt/ta-portal
    
    echo "🔄 Pulling latest changes..."
    git pull origin ta-portal-dev
    
    echo "🐳 Rebuilding and restarting Docker containers..."
    docker compose down
    docker compose up -d --build
    
    echo "⏳ Waiting for services to be healthy..."
    sleep 10
    
    echo "✅ Checking service status..."
    docker compose ps
    
    echo "🎉 Deployment complete!"
ENDSSH

echo "✅ TA Portal deployed successfully!"