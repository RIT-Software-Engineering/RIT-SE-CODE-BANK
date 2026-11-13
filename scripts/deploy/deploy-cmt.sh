#!/bin/bash
set -e

echo "Deploying CMT to apps-staging.se.rit.edu..."

# Configuration
VM_HOST="${DEPLOY_HOST:-apps-staging.se.rit.edu}"
VM_USER="${CMT_DEPLOY_USER:-kag8074}"

# Get the branch name from GitHub Actions environment
# DEPLOY_BRANCH="${GITHUB_REF_NAME:-dev}"
DEPLOY_BRANCH="${cmt-dev2:-cmt-dev2}"

# SSH and deploy
ssh -i "$DEPLOY_KEY" "${VM_USER}@${VM_HOST}" << ENDSSH
    set -e
    
    echo "Navigating to deployment directory..."
    cd "/opt/cmt"

    # install app dependencies
    
    echo "Pulling latest changes from ${DEPLOY_BRANCH}..."
    git fetch origin
    git reset --hard origin/${DEPLOY_BRANCH}
    
    cd ./apps/cmt
    cp ./.env.staging ./.env

    docker compose -f compose.build.yaml -f compose.run.yaml down

    echo "Composing new containers..."
    docker compose -f compose.build.yaml -f compose.run.yaml up -d --build

    echo "Deployment complete. Run `docker ps` for container status "
ENDSSH

echo "CMT Deployed."