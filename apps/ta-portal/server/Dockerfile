FROM node:20-alpine

WORKDIR /app

# Copy prisma and package files over to container
COPY package*.json ./
COPY server/database/prisma ./server/database/prisma/

# Run clean install of dependencies
RUN npm ci

# Generate Prisma client
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate --schema=./server/database/prisma/schema.prisma

# Copy the rest of the application
COPY . .

EXPOSE 3300

# must be ran after db is set up:
#RUN npm run prisma:deploy 
#RUN npm run prisma:seed

CMD ["node", "main.js"]