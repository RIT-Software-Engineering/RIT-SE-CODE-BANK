FROM node:20-alpine

WORKDIR /app

COPY package*.json ./apps/scoop-portal/server
COPY server/prisma/models ./apps/scoop-portal/server/server/prisma/models/

RUN npm ci 

RUN npx prisma generate --schema=./apps/scoop-portal/server/server/prisma/models/schema.prisma

COPY . .

EXPOSE 5020

CMD ["node", "server.js"]