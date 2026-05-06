FROM node:20-alpine
WORKDIR /app

COPY . .

RUN npm ci --omit-dev

RUN npm run --workspace=apps/cmt/frontend build

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

ARG PORT
ENV PORT=$PORT

EXPOSE 3010

CMD ["npm", "run", "--workspace=apps/cmt/frontend", "start"]
