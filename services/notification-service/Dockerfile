FROM node:20-alpha

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY ..

EXPOSE 4000

CMD ["npm", "start"]