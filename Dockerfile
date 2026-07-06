# Production Dockerfile - Simplified from root
FROM node:18-alpine

RUN apk add --no-cache curl tini

WORKDIR /app

# Copy everything
COPY . .

# Install at root (no lock file needed)
RUN npm install --omit=dev --legacy-peer-deps --force 2>&1 || true

WORKDIR /app/packages/backend

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD curl -sf http://localhost:3001/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["npm", "start"]
