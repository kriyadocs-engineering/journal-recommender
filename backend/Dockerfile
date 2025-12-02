# Backend Dockerfile for ECS Production Deployment
# Optimized Alpine-based Node.js image

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R node:node uploads

# Set environment variables (these should be overridden at runtime)
ENV NODE_ENV=production \
    PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

# Run as non-root user
USER node

# Use dumb-init for proper PID 1 behavior
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "dist/index.js"]

# Labels for container registry
LABEL org.opencontainers.image.source="https://github.com/Manikandan24-kr/journal-recommender" \
      org.opencontainers.image.description="Journal Recommender Backend API" \
      org.opencontainers.image.title="journal-recommender-backend"
