// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';

import react from '@astrojs/react';

// The Keystatic admin (/keystatic + its API routes) is only mounted in dev or
// when GitHub-mode credentials are provided at build time. A production build
// without them ships no admin at all — local-mode editing on a deployed
// container would be unauthenticated.
const enableKeystatic =
  process.env.NODE_ENV !== 'production' || Boolean(process.env.KEYSTATIC_GITHUB_CLIENT_ID);

// https://astro.build/config
export default defineConfig({
  site: 'https://korikosmos.dev',
  output: 'server',
  prefetch: true,
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [tailwind(), sitemap(), react(), ...(enableKeystatic ? [keystatic()] : [])],
});