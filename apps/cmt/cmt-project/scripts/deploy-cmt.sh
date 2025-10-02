#!/bin/bash
set -e

APP_DIR="/opt/cmt"
BRANCH="cmt-dev"

echo "Deploying CMT application..."

cd $APP_DIR

# Pull latest code
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Stop existing containers
docker compose down

# Rebuild and start containers
docker compose up -d --build

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 15

# Check service status
docker compose ps

echo "CMT deployment complete!"