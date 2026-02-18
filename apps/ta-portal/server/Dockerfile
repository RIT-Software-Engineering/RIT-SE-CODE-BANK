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

#CMD ["npm", "run", "prisma:deploy"] TODO: change so this always runs after the db is fully setup

CMD ["node", "main.js"]