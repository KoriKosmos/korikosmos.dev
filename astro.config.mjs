// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';

import react from '@astrojs/react';

const SITE = 'https://korikosmos.dev';

// @astrojs/sitemap can only enumerate routes it knows statically, which in
// `output: 'server'` means prerendered ones. blog/[slug] and portfolio/[slug]
// had to become SSR so they can read the skin cookie, so they dropped out of
// the sitemap entirely — customPages puts them back.
//
// Slugs come from the filenames because that is what `getCollection()` derives
// them from; nothing in src/content overrides `slug` in frontmatter. If an
// entry ever does, this needs to read the frontmatter instead.
function contentUrls(collection, base) {
  const dir = new URL(`./src/content/${collection}/`, import.meta.url);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(file => /\.mdx?$/.test(file))
    .map(file => `${SITE}${base}/${path.basename(file, path.extname(file))}/`);
}

// The Keystatic admin (/keystatic + its API routes) is only mounted in dev or
// when GitHub-mode credentials are provided at build time. A production build
// without them ships no admin at all — local-mode editing on a deployed
// container would be unauthenticated.
const enableKeystatic =
  process.env.NODE_ENV !== 'production' || Boolean(process.env.KEYSTATIC_GITHUB_CLIENT_ID);

// https://astro.build/config
export default defineConfig({
  site: SITE,
  output: 'server',
  prefetch: true,
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    tailwind(),
    sitemap({
      customPages: [...contentUrls('blog', '/blog'), ...contentUrls('projects', '/portfolio')],
      // The CMS is not content anyone should find in search. Matched at the
      // start of the path, not anywhere in the URL — a post slugged
      // "admin-guide" would otherwise drop itself out of the sitemap.
      filter: page => !/^\/(admin|keystatic)(\/|$)/.test(new URL(page).pathname),
    }),
    react(),
    ...(enableKeystatic ? [keystatic()] : []),
  ],
});