import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import type { ContentIndexItem } from '../lib/contentIndex';

// Request-independent (no skin, no cookies), so it is built once as a static
// file, like the OG cards. See src/lib/contentIndex.ts for who reads it.
export const prerender = true;

export const GET: APIRoute = async () => {
  const [posts, projects] = await Promise.all([getCollection('blog'), getCollection('projects')]);
  const items: ContentIndexItem[] = [
    ...posts.map(post => ({
      section: 'Blog' as const,
      title: post.data.title,
      desc: post.data.description,
      url: `/blog/${post.slug}`,
    })),
    ...projects.map(project => ({
      section: 'Projects' as const,
      title: project.data.title,
      desc: project.data.summary,
      url: `/portfolio/${project.slug}`,
    })),
  ];
  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json' },
  });
};
