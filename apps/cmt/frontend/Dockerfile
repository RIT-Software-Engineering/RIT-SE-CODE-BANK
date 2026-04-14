FROM node:20-alpine
WORKDIR /app

COPY . .

RUN pwd
RUN ls

RUN npm ci

RUN npm run --workspace=apps/cmt/frontend build

# run only that workspace
CMD ["npm", "run", "--workspace=apps/cmt/frontend", "start"]