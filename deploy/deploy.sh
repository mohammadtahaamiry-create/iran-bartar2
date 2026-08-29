#!/usr/bin/env bash
# Deployment script for Iran Behtar app on a Node.js server.
# Usage: bash deploy/deploy.sh
set -euo pipefail

echo "=== Iran Behtar deployment ==="

# Ensure we are in the project root
cd "$(dirname "$0")/.."
echo "Working directory: $(pwd)"

# Check Node version
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js not found. Install Node.js 18+ first."
  exit 1
fi
echo "Node version: $(node -v)"

# Install dependencies
echo ""
echo "=== Installing dependencies ==="
npm install

# Generate Prisma client
echo ""
echo "=== Generating Prisma client ==="
npx prisma generate

# Build the app
echo ""
echo "=== Building the app ==="
npm run build

# Ensure the database directory exists
echo ""
echo "=== Initializing database ==="
mkdir -p db
npx prisma db push --accept-data-loss

# Ensure logs directory exists (for PM2)
mkdir -p logs

echo ""
echo "=== Build complete ==="
echo "Standalone build output: .next/standalone/"
echo ""
echo "To start the server, choose one of the following methods:"
echo ""
echo "1) Direct (simple):"
echo "   npm start"
echo ""
echo "2) PM2 (recommended for production):"
echo "   npm install -g pm2"
echo "   pm2 start ecosystem.config.cjs"
echo "   pm2 save"
echo "   pm2 startup  # to enable on boot"
echo ""
echo "3) systemd (most robust):"
echo "   sudo cp deploy/iran-behtar.service /etc/systemd/system/"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable --now iran-behtar"
echo ""
