# Multi-stage Dockerfile for Iran Behtar app on Cloudflare
# Produces a minimal production image.

# ---- Stage 1: deps ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Install ffmpeg (needed for voice-to-text conversion)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifests and prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install dependencies (including devDependencies for build)
RUN npm ci || npm install

# ---- Stage 2: builder ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install ffmpeg in builder too (in case any build script needs it)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for the build (use defaults; runtime values come from env)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/tmp/build.db"

# Build the Next.js standalone output
RUN npx prisma generate
RUN npm run build

# ---- Stage 3: runner ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Install ffmpeg in runtime (needed for ASR route)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Create the database directory with proper permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

# Copy standalone build output (includes only necessary node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => process.exit(r.statusCode < 500 ? 0 : 1))" || exit 1

# Start the server
CMD ["node", "server.js"]
