import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_TITLE } from '../../config';
import { PAGE_META, pageCardKey } from '../../data/pageMeta';
import { renderOgCard, type OgCard } from '../../lib/ogCard';
import { formatPostDate, readingMinutes } from '../../lib/reading';

// Social cards, one PNG per page: /og/site.png (homepage + fallback),
// /og/page/<route>.png for every fixed page in PAGE_META,
// /og/blog/<slug>.png and /og/portfolio/<slug>.png for collection entries.
// Prerendered: the cards don't depend on the request, and rendering them at
// build keeps CanvasKit out of the server image. Drawing lives in
// src/lib/ogCard.ts.
export const prerender = true;

export const getStaticPaths = (async () => {
  const cards: Record<string, OgCard> = {
    site: { home: true, title: SITE_TITLE, description: PAGE_META['/'].description },
  };

  for (const [path, meta] of Object.entries(PAGE_META)) {
    if (path === '/' || !('title' in meta)) continue;
    cards[pageCardKey(path)] = { title: meta.title, description: meta.description, kicker: path };
  }

  for (const post of await getCollection('blog')) {
    const date = formatPostDate(post.data.pubDate.toISOString());
    cards[`blog/${post.slug}`] = {
      title: post.data.title,
      description: post.data.description,
      kicker: `/blog · ${date} · ${readingMinutes(post.body)} min read`,
    };
  }

  for (const project of await getCollection('projects')) {
    const repo = project.data.github?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    cards[`portfolio/${project.slug}`] = {
      title: project.data.title,
      description: project.data.summary,
      kicker: repo ? `/portfolio · ${repo}` : '/portfolio',
    };
  }

  return Object.entries(cards).map(([key, card]) => ({ params: { route: `${key}.png` }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgCard((props as { card: OgCard }).card);
  return new Response(png as Uint8Array<ArrayBuffer>, { headers: { 'Content-Type': 'image/png' } });
};
