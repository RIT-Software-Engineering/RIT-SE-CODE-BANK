FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl

COPY . .

RUN npm ci --workspace=apps/workflow/ecosystem --workspace=apps/cmt/backend

WORKDIR /app/apps/cmt/backend


# Set DB URL for Prisma
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

EXPOSE 5010

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate reset --force --skip-seed && npx prisma db push --accept-data-loss && node prisma/seed.js && node server.js"]