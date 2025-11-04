FROM node:20-alpine
WORKDIR /app

# Copy package files from backend
COPY src/backend/package*.json ./

# Copy prisma schema from project root
COPY prisma ./prisma/  

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy rest of backend application
COPY src/backend/ .

EXPOSE 5010 

CMD node server.js