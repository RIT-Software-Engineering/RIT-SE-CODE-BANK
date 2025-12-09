set -e

APP_DIR="/opt/scoop-portal"
BRANCH="scoop-portal-dev"
PORTAL_SERVER_DIR="$APP_DIR/apps/scoop-portal/server"
PORTAL_UI_DIR="$APP_DIR/apps/scoop-portal/ui"
WORKFLOW_SERVER_DIR="$APP_DIR/apps/workflow/server"

echo "Deploying Scoop Portal application..."

cd $APP_DIR

git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

docker compose down

create_env_file() {
  local file_path="$1"
  local content="$2"
  if [ ! -f "$file_path" ]; then
    echo "Creating $(basename "$file_path")..."
    echo "$content" > "$file_path"
  fi
}

create_env_file "$PORTAL_SERVER_DIR/.env" \
'DATABASE_URL="mysql://root:password@localhost:3308/scoop_portal_demo"
WORKFLOWS_URL="mysql://root:password@127.0.0.1:3307/scoop_portal_demo"
PORT=5000'

create_env_file "$PORTAL_UI_DIR/.env" \
'PORT=3020
API_PORT=5020
NEXT_PUBLIC_URL_BASE_PATH=/scoop-portal'

create_env_file "$PORTAL_UI_DIR/.env.development" \
'NEXT_PUBLIC_API_URL=http://localhost:5020
NEXT_PUBLIC_WORKFLOWS_API_URL=http://localhost:5001'

create_env_file "$WORKFLOW_SERVER_DIR/.env" \
'DATABASE_URL=mysql://root:password@localhost:3307/scoop_portal_demo
PORT=5001
BASE_URL=http://localhost:3020
NODE_ENV=development'



docker compose up -d --build
echo "we made it"
cd ./apps/scoop-portal/server
echo $(pwd)


echo "Waiting for services to start..."
sleep 15
npx prisma migrate deploy
npx prisma db seed
cd $APP_DIR
docker compose ps

echo "SCOOP Portal deployment complete!"