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

# Run clean install of dependencies for only the server
RUN npm ci --workspace=ta-portal-server

# Generate Prisma client. Prisma requires DATABASE_URL to be defined for generate, but does not need to access it during build time.
# A placeholder can be placed here, with the compose.yaml overriding the url with the proper one once built.
# This prevents database credentials from being baked into the image.
ENV DATABASE_URL="mysql://placeholder"
RUN npx prisma generate --schema=./apps/ta-portal/server/server/database/prisma/schema.prisma

# Copy the rest of the application
COPY apps/ta-portal/server ./apps/ta-portal/server

# Set work directory to server dir
WORKDIR /app/apps/ta-portal/server

# Copy entrypoint script to /usr/local/bin
COPY apps/ta-portal/server/entrypoint.sh /usr/local/bin/entrypoint.sh
# change permissions to allow the running of the entry point script
RUN chmod +x /usr/local/bin//entrypoint.sh

EXPOSE 3300

ENTRYPOINT sh /usr/local/bin/entrypoint.sh