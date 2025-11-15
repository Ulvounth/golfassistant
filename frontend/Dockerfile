# Frontend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Kopier package files
COPY package*.json ./

# Installer dependencies
RUN npm ci

# Kopier source code
COPY . .

# Bygg app
RUN npm run build

# Production stage med Nginx
FROM nginx:alpine

# Kopier built files til nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopier nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
