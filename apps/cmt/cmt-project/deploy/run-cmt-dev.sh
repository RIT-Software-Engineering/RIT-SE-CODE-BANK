#!/bin/bash
# docker compose -f docker-compose.yml up -d --build

docker compose --env-file .env.staging -f docker-compose.yml up -d --build