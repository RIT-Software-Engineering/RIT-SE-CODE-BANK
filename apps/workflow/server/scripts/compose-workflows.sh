set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

ENV_FILE="$PROJECT_ROOT/.env.staging"

echo "Using env file: $ENV_FILE"

docker compose --env-file "$ENV_FILE" -f "$PROJECT_ROOT/docker-compose.yml" up -d --build