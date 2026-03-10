set -e

cd apps/ta-portal/deploy

docker compose -f compose.yaml -f compose.dev.yaml up --build