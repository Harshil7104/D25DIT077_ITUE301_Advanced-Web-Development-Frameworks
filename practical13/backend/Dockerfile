# Use official Node.js LTS Alpine image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy backend source files
COPY . .

# Expose backend service port
EXPOSE 5000

# Start Express server using existing npm start script
CMD ["npm", "start"]
