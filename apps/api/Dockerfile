# Stage 1: Build & install dependencies
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production execution environment
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src/
EXPOSE 3121
CMD ["node", "src/server.js"]