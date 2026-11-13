FROM node:20

# Keep the entire repository under /app
WORKDIR /app

# Copy the root package files first
COPY package*.json ./

# Copy the frontend package files and shared package files
COPY apps/teambuilding/ui/package*.json ./apps/teambuilding/ui/
COPY packages/teambuilding-components/package*.json ./packages/teambuilding-components/


# Install dependencies from the repository root
RUN npm install

# Copy the frontend source code
COPY apps/teambuilding/ui ./apps/teambuilding/ui

# Copy the shared component package
COPY packages/teambuilding-components ./packages/teambuilding-components

# Move into the frontend directory
WORKDIR /app/apps/teambuilding/ui

EXPOSE 3001

CMD ["npm", "run", "dev"]