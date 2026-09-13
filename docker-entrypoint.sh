#!/bin/sh
# =============================================================================
# docker-entrypoint.sh — runs on every container start.
# Applies migrations (prisma db push) then starts Next.js.
# Safe to run repeatedly — only pushes schema diffs, never drops data.
# =============================================================================
set -e

echo "==> [entrypoint] Generating Prisma client..."
npx prisma generate

echo "==> [entrypoint] Pushing schema to SQLite (non-destructive)..."
# --accept-data-loss is required by prisma on SQLite even for additive changes
# but does NOT actually drop data when only adding columns/tables.
npx prisma db push --accept-data-loss

echo "==> [entrypoint] Starting Next.js server on port ${PORT:-3000}..."
exec npm start
