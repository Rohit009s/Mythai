# Multi-stage Dockerfile for Spirit AI

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend Runtime
FROM node:18-alpine AS backend
WORKDIR /app

# Install backend dependencies
COPY server/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY server/ ./
COPY data/ ./data/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:10000/health || exit 1

# Start the server
CMD ["npm", "start"]