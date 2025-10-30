set -e

APP_DIR="/opt/scoop-portal"
BRANCH="scoop-portal-cicd-dev"

echo "Deploying Scoop Portal application..."

cd $APP_DIR

git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

docker compose down

docker compose up -d --build

cd ./apps/scoop-portal/server
npx prisma migrate dev --name init
npx prisma db seed
cd $APP_DIR

echo "Waiting for services to start..."
sleep 15

docker compose ps

echo "SCOOP Portal deployment complete!"