FROM node:20-alpine

WORKDIR /app

# Copy package files over to container
## Root Package
COPY package.json ./
## Root Package-Lock
COPY package-lock.json ./
## Server Package
COPY apps/ta-portal/server/package.json apps/ta-portal/server/package.json

# Copy prisma schema to container
COPY apps/ta-portal/server/server/database/prisma ./apps/ta-portal/server/server/database/prisma/

# Run clean install of dependencies
RUN npm ci --workspace=ta-portal-server

# Generate Prisma client
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate --schema=./apps/ta-portal/server/server/database/prisma/schema.prisma

# Copy the rest of the application
COPY apps/ta-portal/server ./apps/ta-portal/server

WORKDIR /app/apps/ta-portal/server

COPY apps/ta-portal/server/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin//entrypoint.sh

EXPOSE 3300

ENTRYPOINT sh /usr/local/bin/entrypoint.sh