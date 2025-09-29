FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S workflow -u 1001

# Change ownership
RUN chown -R workflow:nodejs /app
USER workflow

EXPOSE 3001

# Start the application
CMD ["node", "index.js"]