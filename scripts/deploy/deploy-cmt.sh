#!/bin/bash
set -e

echo "Deploying CMT to apps-staging.se.rit.edu..."

# Configuration
VM_HOST="${DEPLOY_HOST:-apps-staging.se.rit.edu}"
VM_USER="${CMT_DEPLOY_USER:-fjg5149}"
DEPLOY_PATH="/opt/cmt"
# Get the branch name from GitHub Actions environment
DEPLOY_BRANCH="${GITHUB_REF_NAME:-dev}"
# SSH and deploy

ssh -i "$DEPLOY_KEY" "${VM_USER}@${VM_HOST}" << ENDSSH
    set -e
    
    echo "Navigating to deployment directory..."
    cd ${DEPLOY_PATH}
    
    echo "Pulling latest changes from ${DEPLOY_BRANCH}..."
    git fetch origin
    git reset --hard origin/${DEPLOY_BRANCH}
    
    echo "Rebuilding and restarting Docker containers..."
    cd ./apps/cmt
    
    docker compose --env-file ".env.staging" -f compose.build.yaml -f compose.run.yaml up -d --build
    
    echo "Waiting for services to be healthy..."
    sleep 10
    
    echo "Checking service status..."
    docker compose ps
    
    echo "Deployment complete!"
ENDSSH

echo "CMT deployed successfully!"