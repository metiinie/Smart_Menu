# --- Stage 1: Build ---
FROM node:20-alpine AS builder

# Install system dependencies needed for Prisma and build
RUN apk add --no-cache libc6-compat openssl

RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files and prisma schema
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build the application
RUN pnpm build

# --- Stage 2: Production ---
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache libc6-compat openssl

RUN npm install -g pnpm

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Expose the port
EXPOSE 3001

# Run migrations and start the application
# We use npx prisma migrate deploy to ensure DB is up to date on every deploy
CMD ["sh", "-c", "npx prisma migrate deploy && pnpm start"]
