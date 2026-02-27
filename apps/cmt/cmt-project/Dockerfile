FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy application files
COPY . .

# Install backend dependencies and generate Prisma client
WORKDIR /app/src/backend
RUN npm ci --legacy-peer-deps
RUN npx prisma generate --schema=../../prisma/schema.prisma

# Return to project root and build the React app
WORKDIR /app
RUN npm run build

EXPOSE 3010

# Start the app on port 3010
CMD ["sh", "-c", "PORT=3010 npm start"]