FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache openssl

# Copy root package files (if any) and backend package.json for caching
COPY package*.json ./
COPY src/backend/package*.json src/backend/

# Install root deps (if needed) and backend deps
RUN npm ci --legacy-peer-deps || true    # ignore if root has no deps
WORKDIR /app/src/backend
RUN npm ci --legacy-peer-deps

# Copy Prisma schema and backend source
WORKDIR /app
COPY prisma ./prisma

# also place the schema inside the backend folder so generation can run locally
RUN mkdir -p src/backend/prisma
COPY prisma/schema.prisma src/backend/prisma/
COPY prisma/seed.js src/backend/prisma/

COPY src/backend ./src/backend
COPY src/utils ./src/utils

# Set DB URL for Prisma
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Generate Prisma client using the schema now located in backend/prisma
WORKDIR /app/src/backend

RUN npx prisma generate

EXPOSE 5010

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma migrate reset --force --skip-seed && node prisma/seed.js && node server.js"]