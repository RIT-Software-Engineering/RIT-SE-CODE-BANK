#!bin/sh
set -e

echo "Running Prisma Migration"
npm run prisma:deploy

echo "Starting Backend"
node main.js

