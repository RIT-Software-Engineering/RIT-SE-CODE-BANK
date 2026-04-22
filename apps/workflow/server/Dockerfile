# Workflows Server Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy repo (in the future, only package.jsons can be copied)
COPY . .

# Install dependencies
RUN npm ci --workspace=apps/workflow/server --omit=dev 

# Move to workflows folder
WORKDIR /app/apps/workflow/server

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 5011

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5011

# Start the server
CMD ["sh", "-c", "npx prisma db push && node prisma/cmtSeed.js && node index.js"]