FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache openssl

# Copy package.json first for caching
# COPY src/backend/package*.json ./
COPY . .

# Install dependencies
RUN npm ci --legacy-peer-deps
RUN cd src/backend npm ci --legacy-peer-deps

# Copy prisma schema and backend code **before generating client**
# COPY prisma ./prisma/
# COPY src/backend/ ./backend
# COPY src/utils/ ./utils

# Set DB URL for Prisma
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Generate Prisma client AFTER backend is copied
RUN npx prisma generate

EXPOSE 5010

# For dev: reset DB and run server
CMD ["sh", "-c", "npx prisma db push && node backend/server.js"]


