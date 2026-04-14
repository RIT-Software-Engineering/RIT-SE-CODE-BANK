FROM node:20-alpine
WORKDIR /app

# Copy top level npm workspace stuff (package.json) and also relevant project
COPY package*.json ./
COPY apps/cmt/frontend ./apps/cmt/frontend

RUN npm ci --workspace cmt-frontend

# Build the React app
RUN cd apps/cmt/frontend
RUN npm run build

EXPOSE 3010

# Start the app on port 3010
CMD ["sh", "-c", "PORT=3010 npm start"]