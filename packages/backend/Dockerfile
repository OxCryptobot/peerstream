# PayTray Backend - Production Dockerfile for Monorepo
# This file is at packages/backend/Dockerfile
# Docker context is the root directory when built from Railway
FROM node:18-alpine

# Install utilities
RUN apk add --no-cache curl tini

# Set working directory
WORKDIR /app

# Step 1: Copy root package files (monorepo configuration)
COPY package*.json ./

# Step 2: Install dependencies (only production)
RUN npm install --omit=dev --legacy-peer-deps 2>&1 && npm cache clean --force

# Step 3: Copy backend source
COPY packages/backend ./packages/backend

# Step 4: Set backend as working directory  
WORKDIR /app/packages/backend

# Expose backend port
EXPOSE 3001

# Health check using curl (more reliable)
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD curl -sf http://localhost:3001/api/health || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["npm", "start"]
