#!/bin/sh
set -e

echo "► Running Prisma migrations..."
npx -y prisma@6 migrate deploy

echo "► Starting Next.js server..."
exec node server.js