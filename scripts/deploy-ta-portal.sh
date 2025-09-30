#!/bin/bash
set -e

echo "🚀 Deploying TA Portal to apps-staging.se.rit.edu..."

# Configuration
VM_HOST="${DEPLOY_HOST:-apps-staging.se.rit.edu}"
VM_USER="${DEPLOY_USER:-kc8563}"
DEPLOY_PATH="/opt/ta-portal"
# Get the branch name from GitHub Actions environment
DEPLOY_BRANCH="${GITHUB_REF_NAME:-ta-portal-dev}"

# SSH and deploy
ssh "${VM_USER}@${VM_HOST}" << ENDSSH
    set -e
    
    echo "📂 Navigating to deployment directory..."
    cd /opt/ta-portal
    
    echo "🔄 Pulling latest changes from ${DEPLOY_BRANCH}..."
    git fetch origin
    git reset --hard origin/${DEPLOY_BRANCH}
    
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