# PayTray Backend Production Dockerfile
FROM node:18-alpine

# Install dumb-init to properly handle signals
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error()})"

# Use dumb-init to run node
# This ensures proper signal handling for graceful shutdown
ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["node", "server.js"]
