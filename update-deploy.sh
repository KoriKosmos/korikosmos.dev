#!/bin/sh
set -e

echo "🚀 Deploying updates..."

# 1. Pull latest changes
echo "📥 Pulling from git..."
git pull

# 2. Rebuild and restart containers
echo "Example: 🐳 Rebuilding and restarting Docker containers..."
docker compose up -d --build --remove-orphans

# 3. Prune old images (optional, keeps disk space clean)
docker image prune -f

echo "✅ Deployment complete! Server is running."
