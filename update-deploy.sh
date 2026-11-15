#!/bin/sh
set -e

# Runs from this clone whoever calls it: me, the site's deploy workflow, or
# BountyIdle's deploy workflow (both on the self-hosted runner).
cd "$(dirname "$0")"

# One deploy at a time. The site and the game each have a workflow that calls
# this, so a push to both at once would otherwise rebuild twice in parallel.
if command -v flock >/dev/null 2>&1; then
  exec 9>"${TMPDIR:-/tmp}/korikosmos-deploy.lock"
  echo "⏳ Waiting for any other deploy to finish..."
  flock 9
fi

echo "🚀 Deploying updates..."

# 1. Pull latest changes
echo "📥 Pulling from git..."
git pull

# 2. Find the newest Bounty Office. BountyIdle is public, so this needs no
#    token. The Docker build bakes that commit into the image; if GitHub can't
#    be reached, the arg stays empty and the committed copy ships instead.
BOUNTY_OFFICE_REF=$(git ls-remote https://github.com/KoriKosmos/BountyIdle refs/heads/main 2>/dev/null | cut -f1 || true)
export BOUNTY_OFFICE_REF
echo "🎯 Bounty Office: ${BOUNTY_OFFICE_REF:-committed copy}"

# 3. Rebuild and restart containers
echo "🐳 Rebuilding and restarting Docker containers..."
docker compose up -d --build --remove-orphans --force-recreate

# 4. Prune old images (optional, keeps disk space clean)
docker image prune -f

echo "✅ Deployment complete! Server is running."
