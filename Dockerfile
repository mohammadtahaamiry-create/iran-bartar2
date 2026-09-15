# =============================================================================
# Dockerfile — ایران برتر (Iran Behtar)
# -----------------------------------------------------------------------------
# Multi-stage build. NO secrets are baked into the image:
#   - .env is never COPYed into the image (see .dockerignore)
#   - All secret env vars (DATABASE_URL, SETTINGS_ENCRYPTION_KEY, NEXTAUTH_SECRET,
#     OPENROUTER API keys, ...) are injected at RUNTIME via --env-file or docker-compose
#   - SQLite database lives on a named/host volume at /app/data (persists across
#     rebuilds & redeployments)
#
# Build:    docker build -t iran-behtar:latest .
# Run:     docker run -d --name iran-behtar -p 3000:3000 \
#            --env-file .env.production \
#            -v iran_behtar_data:/app/data \
#            iran-behtar:latest
# Update:  docker build -t iran-behtar:latest . && docker rm -f iran-behtar && docker run -d ...
#          (the volume keeps your database safe)
# =============================================================================

# ---- Stage 1: deps (cache node_modules) ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Install ffmpeg (needed for voice-to-text conversion)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy only manifests + prisma schema for deterministic installs
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install ALL deps (including devDeps — needed for build)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---- Stage 2: builder ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time only — these are NOT real secrets, just values so Next.js can run
# static generation during build. They are overridden at runtime via env-file.
# NOTE: settings.ts validates the encryption key lazily (on first use), so the
# build itself never encrypts anything — but we still provide a well-formed
# value to avoid any edge-case module evaluation issues.
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/tmp/build-only.db"
ENV SETTINGS_ENCRYPTION_KEY="build-stage-only-key-0123456789abcdef-FAKE"
ENV NEXTAUTH_SECRET="build-stage-only-secret-0123456789abcdef-FAKE"

# Generate Prisma client + build Next.js
RUN npx prisma generate
RUN npm run build

# Remove devDependencies (production-only node_modules)
RUN npm prune --omit=dev

# ---- Stage 3: runtime ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Runtime system deps: ffmpeg for ASR, wget/curl for healthcheck, dumb-init for signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    wget \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Production environment — runtime secrets MUST come from env-file at `docker run`
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# IMPORTANT: DATABASE_URL points to the volume mount; the actual value is overridden
# at runtime by the env-file to ensure data persistence.
ENV DATABASE_URL="file:/app/data/custom.db"

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

# Persistent data directory (mounted as a volume at runtime)
RUN mkdir -p /app/data \
    && chown -R nextjs:nodejs /app

# Copy only what we need from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

# Copy the entrypoint + admin bootstrap script (runs migrations & bootstrap before Next.js)
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
COPY --chown=nextjs:nodejs docker/bootstrap-admin.cjs /app/docker/bootstrap-admin.cjs
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

# Healthcheck: HTTP GET on /
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Use dumb-init to properly handle SIGTERM for graceful shutdown
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/app/docker-entrypoint.sh"]
