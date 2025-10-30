# ============================================================================
# DOCKERFILE
# Multi-stage build for production-ready container
# ============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Cache bust to force Railway to rebuild - Update: 2025-10-29-FINAL
ARG CACHE_BUST=2025-10-29-FINAL
RUN echo "Cache bust: $CACHE_BUST"

# Install build dependencies for native modules and Prisma
RUN apk add --no-cache python3 make g++ openssl

# Copy package files
COPY package*.json ./

# Debug: Show what package files exist
RUN echo "=== Package files ===" && ls -la package*.json

# Debug: Check if pdfjs-dist is in package.json
RUN echo "=== Checking for pdfjs in package.json ===" && (grep -i pdf package.json || echo "No PDF packages found")

# Install all dependencies (including devDependencies for build)
# Use npm install if package-lock.json doesn't exist, otherwise use npm ci
RUN if [ -f package-lock.json ]; then \
      echo "=== Using npm ci ===" && npm ci --legacy-peer-deps; \
    else \
      echo "=== Using npm install ===" && npm install --legacy-peer-deps; \
    fi

# Debug: Verify pdfjs-dist was NOT installed
RUN echo "=== Checking installed packages ===" && (ls node_modules | grep -i pdf || echo "No PDF packages in node_modules")

# CRITICAL FIX: Verify TypeScript is installed and install if missing
RUN echo "=== Verifying TypeScript installation ===" && \
    if [ ! -f node_modules/.bin/tsc ]; then \
      echo "TypeScript NOT found - installing explicitly..." && \
      npm install --save-dev typescript@5.9.3; \
    else \
      echo "TypeScript found at:" && ls -la node_modules/.bin/tsc && \
      node_modules/.bin/tsc --version; \
    fi

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client with dummy DATABASE_URL for build
# Railway will provide the real DATABASE_URL at runtime
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate

# Copy source code
COPY . .

# Debug: Show what files were copied
RUN echo "=== Files in /app ===" && ls -la

# Debug: Show tsconfig.json exists
RUN echo "=== Checking tsconfig.json ===" && cat tsconfig.json

# Debug: Show package.json build script
RUN echo "=== Build script ===" && cat package.json | grep -A 2 '"build"'

# Debug: Check if TypeScript is installed
RUN echo "=== Checking TypeScript installation ===" && \
    ls -la node_modules/.bin/tsc && \
    npx tsc --version || echo "TypeScript not found or failed to run"

# Debug: Check if tsconfig.json is valid JSON
RUN echo "=== Validating tsconfig.json ===" && \
    cat tsconfig.json | head -30

# Build TypeScript - Use explicit path to tsc binary
RUN echo "=== Running TypeScript build ===" && \
    ./node_modules/.bin/tsc --project tsconfig.json

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
# Use npm install if package-lock.json doesn't exist, otherwise use npm ci
RUN if [ -f package-lock.json ]; then npm ci --production --legacy-peer-deps --ignore-scripts; else npm install --production --legacy-peer-deps --ignore-scripts; fi

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
