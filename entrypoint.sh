#!/bin/sh
set -e

echo "► Running Prisma migrations..."
node /app/node_modules/prisma/build/index.js migrate deploy 2>&1 || echo "⚠️  Migrations failed (non-fatal, continuing...)"

echo "► Starting Next.js server..."
exec node server.js