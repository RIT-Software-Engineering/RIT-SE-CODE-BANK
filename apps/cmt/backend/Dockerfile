FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl

# Copy package files. im not sure why "COPY . ." doesn't cover this
COPY package*.json ./

# Install root deps (if needed) and backend deps
RUN pwd
RUN ls


COPY . .

RUN pwd
RUN ls

# Set DB URL for Prisma
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate

EXPOSE 5010

CMD ["sh", "-c", "npx prisma migrate reset --force --skip-seed && npx prisma db push --accept-data-loss && node prisma/seed.js && node server.js"]