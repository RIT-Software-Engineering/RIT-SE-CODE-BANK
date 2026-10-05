FROM node:18

WORKDIR /app

# Copy the notification service package definition
COPY services/notification-service/package.json ./services/notification-service/package.json

# Copy Prisma schema and migrations
COPY services/notification-service/prisma ./services/notification-service/prisma/

# Install dependencies for the notification service
WORKDIR /app/services/notification-service
RUN npm install

# Placeholder used only while generating the Prisma client
ENV DATABASE_URL="mysql://placeholder"

RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy the application source, including templates
WORKDIR /app
COPY services/notification-service/src ./services/notification-service/src

# Copy the entrypoint
COPY services/notification-service/entrypoint.sh ./services/notification-service/entrypoint.sh

WORKDIR /app/services/notification-service

RUN chmod +x ./entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["sh", "./entrypoint.sh"]