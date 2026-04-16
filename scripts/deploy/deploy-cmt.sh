#!/bin/bash
set -e

echo "Deploying CMT to apps-staging.se.rit.edu..."

# Configuration
VM_HOST="${DEPLOY_HOST:-apps-staging.se.rit.edu}"
VM_USER="${CMT_DEPLOY_USER:-fjg5149}"

# Get the branch name from GitHub Actions environment
DEPLOY_BRANCH="${GITHUB_REF_NAME:-dev}"

# SSH and deploy
ssh -i "$DEPLOY_KEY" "${VM_USER}@${VM_HOST}" << ENDSSH
    set -e
    
    echo "Navigating to deployment directory..."
    cd "/opt/cmt"
    
    echo "Pulling latest changes from ${DEPLOY_BRANCH}..."
    git fetch origin
    git reset --hard origin/${DEPLOY_BRANCH}
    
    cd ./apps/cmt
    
    echo "Attempting to take down previous containers. Continuing if fails..."
    docker compose --env-file ".env.staging" -f compose.build.yaml -f compose.run.yaml down || true

    echo "Composing new containers..."
    docker compose --env-file ".env.staging" -f compose.build.yaml -f compose.run.yaml up -d --build

    echo "Deployment complete. Run `docker ps` for container status "
ENDSSH

echo "CMT Deployed."