# Backend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Kopier package files
COPY package*.json ./

# Installer dependencies
RUN npm ci

# Kopier source code
COPY . .

# Bygg TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Kopier package files
COPY package*.json ./

# Installer kun production dependencies
RUN npm ci --only=production

# Kopier built files
COPY --from=builder /app/dist ./dist

# Eksponer port
EXPOSE 3001

# Sett environment til production
ENV NODE_ENV=production

# Start app
CMD ["node", "dist/index.js"]
