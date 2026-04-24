FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY server/prisma/models ./server/server/prisma/models/

RUN npm ci 

RUN npx prisma generate --schema=./server/server/prisma/models/schema.prisma

COPY . .

EXPOSE 5020

CMD ["node", "server.js"]