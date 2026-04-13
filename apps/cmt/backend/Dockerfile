FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache openssl

COPY . .

# Install root deps (if needed) and backend deps
RUN npm ci --legacy-peer-deps

# Set DB URL for Prisma
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate

EXPOSE 5010

CMD ["sh", "-c", "npx prisma migrate reset --force --skip-seed && npx prisma db push --accept-data-loss && node prisma/seed.js && node server.js"]