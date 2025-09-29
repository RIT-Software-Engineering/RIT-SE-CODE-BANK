FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001
# -g 1001: sets group ID to match nodejs group
# -S: creates a system account
# -u 1001: sets user ID to 1001

# Change ownership
RUN chown -R backend:nodejs /app
USER backend

EXPOSE 3300

CMD ["node", "main.js"]
