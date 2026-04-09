set -e

echo "Deploying Notification Service"

# Configuration
VM_HOST="${DEPLOY_HOST:-apps-staging.se.rit.edu}"
VM_USER="${TA_PORTAL_DEPLOY_USER:-kjk9042}"
DEPLOY_PATH="/opt/notification-service"
# Get the branch name from GitHub Actions environment
DEPLOY_BRANCH="${GITHUB_REF_NAME:-services-notifications-shared}"
# SSH and deploy

ssh -i "$DEPLOY_KEY" "kjk9042@apps-staging.se.rit.edu" \
    DB_ROOT_PASSWORD="$DB_ROOT_PASSWORD" \
    DB_USER_PASSWORD="$DB_USER_PASSWORD" \
    SLACK_BOT_TOKEN="$SLACK_BOT_TOKEN" \
    'bash -s' << ENDSSH

    set -e
    
    echo "Navigating to deployment directory..."
    cd /opt/notification-service
    
    echo "Pulling latest changes from ${DEPLOY_BRANCH}..."
    git fetch origin
    git reset --hard origin/${DEPLOY_BRANCH}

    echo "Rebuilding and restarting Docker containers..."
    cd ./services/notification-service
    docker compose -f compose.build.yaml -f compose.run.yaml -f compose.dev.yaml up -d --build
    
    echo "Waiting for services to be healthy..."
    sleep 10
    
    echo "Checking service status..."
    docker compose ps
    
    echo "Deployment complete!"
ENDSSH

echo "Notification Service deployed successfully!"