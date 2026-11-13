# Use Node.js as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend application
COPY . .

RUN npx prisma generate

# Document the port the application uses
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]