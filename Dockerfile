FROM node:22.17-alpine AS base
RUN npm install -g npm@11.10.0

# 1. Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 1b. Runtime-only dependencies. The build needs Tailwind, TypeScript, jsdom
# and friends; the server it produces does not, so the final image copies
# node_modules from here instead of from `deps`.
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
# git: scripts/sync-bounty-office.mjs fetches the game with it (below).
RUN apk add --no-cache git
# Keystatic: the client id gates whether the /keystatic admin is built at all
# (astro.config.mjs guard); the PUBLIC_ app slug is inlined into the client
# bundle. Both must be present at build time, not just at runtime.
ARG KEYSTATIC_GITHUB_CLIENT_ID
ARG PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
ENV KEYSTATIC_GITHUB_CLIENT_ID=$KEYSTATIC_GITHUB_CLIENT_ID
ENV PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=$PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Bounty Office: update-deploy.sh passes the commit at the tip of BountyIdle's
# main, and the image gets that version of the game in place of the copy
# committed in public/games/bounty-office/. A new commit is a new arg value, so
# Docker can't reuse a cached copy of the old one. If GitHub can't be reached
# the build keeps the committed copy rather than failing the deploy.
ARG BOUNTY_OFFICE_REF
RUN if [ -n "$BOUNTY_OFFICE_REF" ]; then \
      node scripts/sync-bounty-office.mjs "$BOUNTY_OFFICE_REF" \
      || echo "WARNING: could not fetch Bounty Office $BOUNTY_OFFICE_REF; keeping the committed copy"; \
    fi
RUN npm run build

# 3. Production image: the built server plus runtime dependencies only
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=builder /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
