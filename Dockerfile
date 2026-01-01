# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Rebuild better-sqlite3 for Alpine Linux
RUN npm rebuild better-sqlite3

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server source files
COPY src/server ./src/server

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the production server
CMD ["node", "--experimental-specifier-resolution=node", "--loader", "tsx", "src/server/production.ts"]
