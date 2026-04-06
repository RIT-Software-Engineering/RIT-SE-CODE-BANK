FROM node:20-alpine

WORKDIR /app

# Copy package files
##Root package
COPY package.json ./
##Root lock
COPY package-lock.json ./
##Frontend package
COPY apps/ta-portal/ui/package.json apps/ta-portal/ui/package.json

# Clean install dependencies for only the frontend
RUN npm ci --workspace=ta-portal-frontend

# Copy application into container
COPY apps/ta-portal/ui ./apps/ta-portal/ui

# Change build arguments into env variables
ARG NEXT_PUBLIC_NODE_ENV
ENV NEXT_PUBLIC_NODE_ENV=$NEXT_PUBLIC_NODE_ENV

ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

ARG NEXT_PUBLIC_API_EXTENSION
ENV NEXT_PUBLIC_API_EXTENSION=$NEXT_PUBLIC_API_EXTENSION

ARG NEXT_PUBLIC_DATABASE_API_EXTENSION
ENV NEXT_PUBLIC_DATABASE_API_EXTENSION=$NEXT_PUBLIC_DATABASE_API_EXTENSION

ARG NEXT_PUBLIC_SLACK_API_EXTENSION
ENV NEXT_PUBLIC_SLACK_API_EXTENSION=$NEXT_PUBLIC_SLACK_API_EXTENSION

WORKDIR /app/apps/ta-portal/ui

EXPOSE 3000

RUN npm run build
CMD ["npm","start"]