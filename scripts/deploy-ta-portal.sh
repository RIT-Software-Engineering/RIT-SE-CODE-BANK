set -e

echo "Deploying TA Portal to apps-staging.se.rit.edu..."

# Configuration
VM_HOST="${DEPLOY_HOST:-apps-staging.se.rit.edu}"
VM_USER="${TA_PORTAL_DEPLOY_USER:-kjk9042}"
DEPLOY_PATH="/opt/ta-portal"
# Get the branch name from GitHub Actions environment
DEPLOY_BRANCH="${GITHUB_REF_NAME:-ta-portal-dev}"
# SSH and deploy

ssh -i "$DEPLOY_KEY" "kjk9042@apps-staging.se.rit.edu" << ENDSSH
    set -e
    
    echo "Navigating to deployment directory..."
    cd /opt/ta-portal
    
    echo "Pulling latest changes from ${DEPLOY_BRANCH}..."
    git fetch origin
    git reset --hard origin/${DEPLOY_BRANCH}
    
    echo "Rebuilding and restarting Docker containers..."
    cd ./apps/ta-portal/deploy
    docker compose -f compose.yaml -f compose.prod.yaml up -d --build
    
    echo "Waiting for services to be healthy..."
    sleep 10
    
    echo "Checking service status..."
    docker compose ps
    
    echo "Deployment complete!"
ENDSSH

echo "TA Portal deployed successfully!"