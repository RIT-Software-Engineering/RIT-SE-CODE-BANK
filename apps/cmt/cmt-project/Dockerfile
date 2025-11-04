FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy application files
COPY . .

# Build the React app
RUN npm run build

EXPOSE 3010

# Start the app on port 3010
CMD ["sh", "-c", "PORT=3010 npm start"]