FROM node:20-alpine

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY server/database/prisma ./server/database/prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate --schema=./server/database/prisma/schema.prisma

# Copy rest of application
COPY . .

EXPOSE 5000

CMD ["node", "main.js"]