#!/bin/sh
set -e

echo "► Running Prisma migrations..."
npx prisma@6 migrate deploy 2>&1 || echo "⚠️  Migrations failed (non-fatal, continuing...)"

echo "► Starting Next.js server..."
exec node server.js