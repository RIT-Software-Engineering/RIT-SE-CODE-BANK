#!/bin/bash
variable="$(docker volume inspect ta-portal_mariadb_dev_data 2>/dev/null)"
var_length=${#variable}
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
echo "Waiting for services to get healthy"
sleep 10
if [ "$var_length" -lt 3 ]; then
        docker exec -it ta-portal-ta-portal-backend-1 npm run prisma:migrate
        docker exec -it ta-portal-ta-portal-backend-1 npm run prisma:reset
        docker exec -it ta-portal-ta-portal-backend-1 npm run prisma:reset
fi
echo "done"