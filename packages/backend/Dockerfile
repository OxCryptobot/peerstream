# PayTray Backend Production Dockerfile - Monorepo Compatible
FROM node:18-alpine

# Install dumb-init to properly handle signals
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy root package files for monorepo
COPY package*.json ./

# Copy workspace package files
COPY packages/backend/package*.json ./packages/backend/

# Install root dependencies and backend workspace
RUN npm ci --omit=dev

# Copy entire backend code
COPY packages/backend ./packages/backend

# Copy contracts package (may be needed by backend)
COPY packages/contracts ./packages/contracts

# Build step (if needed)
RUN cd packages/backend && npm run build 2>/dev/null || true

# Set working directory to backend
WORKDIR /app/packages/backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "import('http').then(h => h.get('http://localhost:3001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})).catch(e => {throw e})" || exit 1

# Use dumb-init to run node
ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["npm", "start"]
