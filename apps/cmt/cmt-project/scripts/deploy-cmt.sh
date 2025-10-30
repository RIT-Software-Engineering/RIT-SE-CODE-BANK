#!/bin/bash
set -e

APP_DIR="/opt/cmt/apps/cmt/cmt-project"  # ← CHANGED: Full path to project
BRANCH="cmt-dev"

echo "Deploying CMT application..."
cd $APP_DIR
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH
docker compose down
docker compose up -d --build
echo "Waiting for services to start..."
sleep 15
docker compose ps
echo "CMT deployment complete!"