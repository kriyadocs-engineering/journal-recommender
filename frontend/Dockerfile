# Frontend Dockerfile for ECS Production Deployment
# Multi-stage build with Nginx Alpine

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build argument for API URL (set at build time or use runtime config)
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine AS production

# Install envsubst for runtime environment variable substitution
RUN apk add --no-cache gettext

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy runtime config script
COPY <<'EOF' /docker-entrypoint.d/40-inject-env.sh
#!/bin/sh
set -e

# Create runtime config for frontend
cat > /usr/share/nginx/html/config.js << JSEOF
window.__RUNTIME_CONFIG__ = {
  API_URL: "${API_URL:-http://localhost:3001}"
};
JSEOF

echo "Runtime config injected with API_URL: ${API_URL:-http://localhost:3001}"
EOF

RUN chmod +x /docker-entrypoint.d/40-inject-env.sh

# Set environment variables
ENV NGINX_HOST=localhost \
    NGINX_PORT=80 \
    API_URL=http://localhost:3001

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Nginx runs as non-root by default in nginx:alpine
CMD ["nginx", "-g", "daemon off;"]

# Labels for container registry
LABEL org.opencontainers.image.source="https://github.com/Manikandan24-kr/journal-recommender" \
      org.opencontainers.image.description="Journal Recommender Frontend" \
      org.opencontainers.image.title="journal-recommender-frontend"
