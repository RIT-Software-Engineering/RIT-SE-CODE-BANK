FROM node:18

WORKDIR /app

# Copy package files over to container
## Root Package
COPY package.json ./
## Root Package-lock.json
COPY package-lock.json ./
## Notify package
COPY services/notification-service/package.json ./services/notification-service/package.json

# Copy prisma schema to container
COPY services/notification-service/prisma ./services/notification-service/prisma/

# Run clean install of dependencies for only the notification service
RUN npm ci --workspace=notification-service

ENV DATABASE_URL="mysql://placeholder"
RUN npx prisma generate --schema=./services/notification-service/prisma/schema.prisma

COPY services/notification-service ./services/notification-service

WORKDIR /app/services/notification-service

EXPOSE 4000

CMD ["node", "src/index.js"]
