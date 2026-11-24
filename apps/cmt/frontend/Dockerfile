# Switched from a single-stage approach to a multi-stage approach for two reasons: 
# 1. so the correct create react app script is used for production (npm start for dev, npm run build for production)
# 2. multi-stage is a best practice for React apps in production 

# Build stage 
FROM node:20-alpine AS build
WORKDIR /app

COPY . .

RUN npm ci --include=dev

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

ARG REACT_APP_AUTH_BASE
ENV REACT_APP_AUTH_BASE=$REACT_APP_AUTH_BASE

ARG REACT_APP_BASE_URL
ENV REACT_APP_BASE_URL=$REACT_APP_BASE_URL

ARG REACT_APP_LOGIN_MODE
ENV REACT_APP_LOGIN_MODE=$REACT_APP_LOGIN_MODE

RUN npm run --workspace=apps/cmt/frontend build

# Serve stage
FROM nginx:alpine AS serve
COPY apps/cmt/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/cmt/frontend/build /usr/share/nginx/html/cmt

EXPOSE 3010

# CMD ["npm", "run", "--workspace=apps/cmt/frontend", "start"]
CMD ["nginx", "-g", "daemon off;"]