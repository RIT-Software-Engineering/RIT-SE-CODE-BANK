FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install dependencies
RUN npm ci

# Copy application into container
COPY . .

# Change build arguments into env variables
#ARG NEXT_PUBLIC_NODE_ENV
#ENV NEXT_PUBLIC_NODE_ENV=$NEXT_PUBLIC_NODE_ENV

ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

ARG NEXT_PUBLIC_API_EXTENSION
ENV NEXT_PUBLIC_API_EXTENSIONL=$NEXT_PUBLIC_API_EXTENSION

ARG NEXT_PUBLIC_DATABASE_API_EXTENSION
ENV NEXT_PUBLIC_DATABASE_API_EXTENSION=$NEXT_PUBLIC_DATABASE_API_EXTENSION

EXPOSE 3000

# Run in dev mode
#CMD ["npm", "run", "dev"]

# Run in prod mode
RUN npm run build
CMD ["npm","start"]