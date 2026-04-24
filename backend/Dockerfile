# --- Stage 1: Build ---
FROM node:20-alpine AS builder

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json ./backend/
COPY backend/shared/package.json ./backend/shared/
COPY frontend/package.json ./frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY backend ./backend
COPY backend/shared ./backend/shared

# Generate Prisma Client
WORKDIR /app/backend
RUN pnpm prisma generate

# Build the application
RUN pnpm build

# --- Stage 2: Production ---
FROM node:20-alpine AS runner

RUN npm install -g pnpm
WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and necessary files
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/shared ./shared
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3001

# Start the application
CMD ["pnpm", "start"]
