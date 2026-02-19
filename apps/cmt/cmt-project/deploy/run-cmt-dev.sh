#!/bin/bash
if [ -f docker-compose.dev.yml ]; then
  docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
else
  docker compose -f docker-compose.yml up -d --build
fi
