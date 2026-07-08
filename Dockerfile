FROM node:22.17-alpine AS base
RUN npm install -g npm@11.10.0

# 1. Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
# Keystatic: the client id gates whether the /keystatic admin is built at all
# (astro.config.mjs guard); the PUBLIC_ app slug is inlined into the client
# bundle. Both must be present at build time, not just at runtime.
ARG KEYSTATIC_GITHUB_CLIENT_ID
ARG PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
ENV KEYSTATIC_GITHUB_CLIENT_ID=$KEYSTATIC_GITHUB_CLIENT_ID
ENV PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=$PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
