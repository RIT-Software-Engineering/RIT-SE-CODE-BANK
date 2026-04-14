FROM node:20-alpine
WORKDIR /app

COPY . .

RUN npm ci

RUN npm run --workspace=cmt-frontend build

WORKDIR /app/apps/cmt/frontend

CMD ["npm", "start"]