#!/bin/sh
set -e

echo "Running Prisma Migration"
npm run prisma:deploy

echo "Starting Notification Service"
node src/index.js