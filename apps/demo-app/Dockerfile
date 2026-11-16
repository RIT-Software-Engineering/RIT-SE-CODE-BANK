FROM node:20

# Keep the entire repository under /app
WORKDIR /app

# Copy the root package files first
COPY package*.json ./

# Copy the frontend package files and shared package files
COPY apps/demo-app/package*.json ./apps/demo-app/
COPY packages/teambuilding-components/package*.json ./packages/teambuilding-components/


# Install dependencies from the repository root
RUN npm install

# Copy the frontend source code
COPY apps/demo-app ./apps/demo-app

# Copy the shared component package
COPY packages/teambuilding-components ./packages/teambuilding-components

# Move into the frontend directory
WORKDIR /app/apps/demo-app

EXPOSE 3001

CMD ["npm", "run", "dev"]