FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl

COPY . .

RUN pwd
RUN ls

RUN npm ci

RUN npm run --workspace=apps/workflow/ecosystem build

WORKDIR /app/apps/cmt/backend

RUN pwd
RUN ls


# Set DB URL for Prisma
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

EXPOSE 5010

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate reset --force --skip-seed && npx prisma db push --accept-data-loss && node prisma/seed.js && node server.js"]