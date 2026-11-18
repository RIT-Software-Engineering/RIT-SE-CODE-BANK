# Notification Server Dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl

COPY . .

RUN npm ci -w services/notification-service

WORKDIR /app/services/notification-service

RUN npx prisma generate

EXPOSE 4000

CMD ["sh", "-c", "npm start"]