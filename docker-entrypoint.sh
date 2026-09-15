#!/bin/sh
# =============================================================================
# docker-entrypoint.sh — runs on every container start.
#
# Migration strategy (safer than `prisma db push --accept-data-loss`):
#
#   1. Try `prisma migrate deploy` — applies pending migration files in order.
#      This is the production-safe way: it never drops data and only applies
#      SQL that was explicitly written & reviewed.
#
#   2. If no migrations folder exists (e.g., first deploy, or schema was changed
#      but migrations were not created), fall back to `prisma db push` WITHOUT
#      --accept-data-loss. This adds new tables/columns safely. If a destructive
#      change is detected (column drop, type change), it exits with a clear
#      error so the operator can write a proper migration.
#
#   3. As a last resort for fresh databases, `prisma db push` creates all tables.
#
# Data persistence: the SQLite file lives on a volume, so none of these commands
# affect data outside the schema itself.
# =============================================================================
set -e

echo "==> [entrypoint] Generating Prisma client..."
npx prisma generate

# Check if the database is reachable / file is writable.
DB_PATH=$(echo "$DATABASE_URL" | sed 's/^file://')
if [ -n "$DB_PATH" ] && [ "$(dirname "$DB_PATH")" != "." ]; then
  echo "==> [entrypoint] Ensuring database directory exists: $(dirname "$DB_PATH")"
  mkdir -p "$(dirname "$DB_PATH")"
fi

# Check if migrations folder exists and has any migration files.
MIGRATIONS_DIR="/app/prisma/migrations"
HAS_MIGRATIONS="false"
if [ -d "$MIGRATIONS_DIR" ]; then
  if [ -n "$(ls -A "$MIGRATIONS_DIR" 2>/dev/null)" ]; then
    HAS_MIGRATIONS="true"
  fi
fi

if [ "$HAS_MIGRATIONS" = "true" ]; then
  echo "==> [entrypoint] Applying pending migrations (prisma migrate deploy)..."
  # Production-safe: applies only committed migration files, never drops data.
  if ! npx prisma migrate deploy; then
    echo "!!! [entrypoint] prisma migrate deploy failed."
    echo "    This usually means the DB is in a partially-migrated state."
    echo "    Inspect the _prisma_migrations table in the SQLite DB."
    exit 1
  fi
else
  # No migrations folder — use `db push` (safe mode, no --accept-data-loss).
  echo "==> [entrypoint] No migrations folder found; using prisma db push (safe mode)..."
  echo "    (For production, prefer creating migrations with `prisma migrate dev`)"
  if ! npx prisma db push --skip-generate; then
    echo "!!! [entrypoint] prisma db push failed."
    echo "    If the schema has a destructive change (column drop, type change),"
    echo "    create a proper migration instead. See:"
    echo "    https://pris.ly/d/prisma-migrate"
    exit 1
  fi
fi

echo "==> [entrypoint] Checking database connection..."
# Quick smoke test: run a trivial query. If this fails, exit.
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$queryRaw\`SELECT 1 AS ok\`
  .then(() => { console.log('    DB connection OK'); return p.\$disconnect(); })
  .catch((e) => { console.error('    DB connection FAILED:', e.message); process.exit(1); });
"

echo "==> [entrypoint] Bootstrapping admin user (if ADMIN_EMAIL is set)..."
node /app/docker/bootstrap-admin.cjs || {
  echo "!!! [entrypoint] Admin bootstrap failed (non-fatal — you can create the user manually)."
}

echo "==> [entrypoint] Starting Next.js server on port ${PORT:-3000}..."
exec npm start
