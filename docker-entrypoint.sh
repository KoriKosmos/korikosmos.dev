#!/bin/sh
set -e

# Pull latest changes if a repo is provided
if [ -n "$GIT_REPO" ]; then
  if [ ! -d /app/.git ]; then
    echo "Cloning $GIT_REPO"
    rm -rf /app/*
    git clone --depth 1 --branch ${GIT_BRANCH:-main} "$GIT_REPO" /app
  else
    echo "Updating existing repo"
    git -C /app pull "$GIT_REPO" ${GIT_BRANCH:-main}
  fi
fi

cd /app
npm install
npm run build
rm -rf /var/www/html/*
# Astro's Node adapter outputs the static site to dist/client, so copy that to nginx's root
cp -r dist/client/* /var/www/html/

nginx -g 'daemon off;'
