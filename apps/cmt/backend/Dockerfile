FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl

COPY . .

RUN npm ci --omit-dev

WORKDIR /app/apps/cmt/backend

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

EXPOSE 5010

CMD ["sh", "-c", "npm exec -- prisma generate && npm exec --no -- prisma migrate reset --force --skip-seed && npm exec --no -- prisma db push --accept-data-loss && node prisma/seed.js && node server.js"]
