#!/bin/bash
docker compose down
docker volume rm deploy_mariadb_dev_data
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
echo "Waiting for services to get healthy"
sleep 10
docker exec deploy-ta-portal-backend-1 npm run prisma:migrate
docker exec deploy-ta-portal-backend-1 npm run prisma:reset
docker exec deploy-ta-portal-backend-1 npm run prisma:reset

echo "done"