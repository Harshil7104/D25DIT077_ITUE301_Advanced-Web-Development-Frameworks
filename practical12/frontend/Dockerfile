# Stage 1: Build React application with Vite
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve production bundle using lightweight Nginx
FROM nginx:alpine

# Copy built production assets to Nginx default document root
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration supporting React Router SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose Nginx internal port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
