FROM node:20-alpine
WORKDIR /app

COPY . .

RUN pwd
RUN ls

RUN npm ci

RUN pwd
RUN ls

# Build the React app
RUN npm run --workspace=cmt-frontend build

EXPOSE 3010

# Start the app on port 3010
WORKDIR /app/apps/cmt/frontend
CMD ["sh", "-c", "PORT=3010 npm start"]