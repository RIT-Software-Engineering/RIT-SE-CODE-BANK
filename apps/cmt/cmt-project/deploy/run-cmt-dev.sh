#!/bin/bash
# docker compose -f docker-compose.yml up -d --build

ENV_FILE=${1:-.env.development}

docker compose --env-file $ENV_FILE -f docker-compose.yml up -d --build