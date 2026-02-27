#!/bin/sh
set -e

MAX_ATTEMPTS=30
SLEEP_SECONDS=4

attempt=1

echo "Wait for Database"

while [ "$attempt" -le "$MAX_ATTEMPTS" ];
do
    if printf "SELECT 1;" | npx prisma db execute --schema=/app/apps/ta-portal/server/server/database/prisma/schema.prisma --stdin >/dev/null 2>&1
    then
        echo "Database is ready"
        break
    fi

    echo "Attempt $attempt/$MAX_ATTEMPTS failed. Retrying."
    attempt=$((attempt + 1))
    sleep "$SLEEP_SECONDS"
done

if [ "$attempt" -gt "$MAX_ATTEMPTS" ]; then
    echo "Database did not become ready in time."
    exit 1
fi

echo "Running Prisma Migration"
npm run prisma:deploy

echo "Starting Backend"
node main.js