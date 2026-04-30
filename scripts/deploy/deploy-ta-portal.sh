set -e

echo "Deploying TA Portal to apps-staging.se.rit.edu..."

# Configuration
VM_HOST="${DEPLOY_HOST:-apps-staging.se.rit.edu}"
VM_USER="${TA_PORTAL_DEPLOY_USER:-kjk9042}"
SSH_TARGET="${VM_USER}@${VM_HOST}"
DEPLOY_PATH="/opt/ta-portal"
# Get the branch name from GitHub Actions environment
DEPLOY_BRANCH="${GITHUB_HEAD_REF:-$GITHUB_REF_NAME}"
# SSH and deploy

ssh -i "$DEPLOY_KEY" "$SSH_TARGET" \
    'bash -s' << ENDSSH

    set -e
    
    echo "Navigating to deployment directory..."
    cd /opt/ta-portal
    
    echo "Pulling latest changes from ${DEPLOY_BRANCH}..."
    git fetch origin
    git reset --hard origin/${DEPLOY_BRANCH}

    echo "Rebuilding and restarting Docker containers..."
    cd ./apps/ta-portal/deploy

    TAG="staging" docker compose -f compose.build.yaml build
    TAG="staging" docker compose -f compose.run.yaml up -d

    docker image prune -f
    docker builder prune -f
    
    echo "Deployment complete!"
ENDSSH

echo "TA Portal deployed successfully!"