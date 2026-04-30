set -e

echo "Deploying Notification Service"

# Configuration
VM_HOST="${DEPLOY_HOST:-apps-staging.se.rit.edu}"
VM_USER="${TA_PORTAL_DEPLOY_USER:-kjk9042}"
SSH_TARGET="${VM_USER}@${VM_HOST}"
DEPLOY_PATH="/opt/notification-service"
# Get the branch name from GitHub Actions environment
DEPLOY_BRANCH="${GITHUB_HEAD_REF:-$GITHUB_REF_NAME}"
# SSH and deploy

ssh -i "$DEPLOY_KEY" "$SSH_TARGET" \
    'bash -s' << ENDSSH

    set -e
    
    echo "Navigating to deployment directory..."
    cd /opt/notification-service
    
    echo "Pulling latest changes from ${DEPLOY_BRANCH}..."
    git fetch origin
    git reset --hard origin/${DEPLOY_BRANCH}

    echo "Rebuilding and restarting Docker containers..."
    cd ./services/notification-service
    TAG="staging" docker compose -f compose.build.yaml build
    TAG="staging" docker compose -f compose.run-staging.yaml up -d
    
    docker builder prune -f
    docker image prune -f

    echo "Deployment complete!"
ENDSSH

echo "Notification Service deployed successfully!"