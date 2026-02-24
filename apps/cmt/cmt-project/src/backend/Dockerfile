FROM node:20-alpine
WORKDIR /app

# Copy package files from backend
COPY src/backend/package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy prisma schema from project root
COPY prisma ./prisma/  

# Generate Prisma client
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate

# Copy rest of backend application
COPY src/backend/ ./backend

# Copy external utils used by backend
COPY src/utils/ ./utils

EXPOSE 5010 

CMD ["node", "backend/server.js"]
# CMD node server.js
# CMD sh -c "node seed.js && node server.js"