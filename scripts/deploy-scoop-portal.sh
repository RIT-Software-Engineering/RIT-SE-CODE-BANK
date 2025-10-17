set -e

APP_DIR="/opt/scoop-portal"
BRANCH="scoop-portal-cicd"

echo "Deploying Scoop Portal application..."

cd $APP_DIR

git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

docker compose down

docker compose up -d --build

echo "Waiting for services to start..."
sleep 15

docker compose ps

echo "SCOOP Portal deployment complete!"