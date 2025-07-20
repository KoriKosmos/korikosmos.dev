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
rm -rf /usr/share/nginx/html/*
cp -r dist/* /usr/share/nginx/html/

nginx -g 'daemon off;'
