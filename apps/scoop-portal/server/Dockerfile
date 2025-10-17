FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY server/server/prisma ./server/server/prisma

RUN npm ci 

COPY . .

RUN npm run build  

EXPOSE 5020

CMD ["npm", "start"]