# Workflows Server Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --legacy-peer-deps

# Copy prisma schema
# COPY prisma ./prisma/

# Generate Prisma Client
# RUN npx prisma generate

# Copy application code
COPY . .

# Expose port
EXPOSE 5011

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5011

# Start the server
# CMD ["sh", "-c", "npx prisma db push  && node server.js"]
CMD ["sh", "-c", "node index.js"]