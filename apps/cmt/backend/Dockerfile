FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl

# Copy top level npm workspace stuff (package.json) and also relevant project
COPY package*.json ./
COPY apps/cmt/backend ./apps/cmt/backend

RUN npm ci --workspace cmt-frontend

RUN pwd
RUN ls

RUN cd apps/cmt/backend

RUN pwd
RUN ls

# Set DB URL for Prisma
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate

EXPOSE 5010

CMD ["sh", "-c", "npx prisma migrate reset --force --skip-seed && npx prisma db push --accept-data-loss && node prisma/seed.js && node server.js"]