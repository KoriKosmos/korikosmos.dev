import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';
import { SITE_TITLE, SITE_DESCRIPTION } from '../../config';

export const prerender = true;

const blog = await getCollection('blog');
const projects = await getCollection('projects');

// Keys become paths under /og/ (e.g. 'blog/hello-world' -> /og/blog/hello-world.png).
const pages: Record<string, { title: string; description: string }> = {
  site: { title: SITE_TITLE, description: SITE_DESCRIPTION },
  ...Object.fromEntries(
    blog.map(post => [`blog/${post.slug}`, { title: post.data.title, description: post.data.description }])
  ),
  ...Object.fromEntries(
    projects.map(project => [
      `portfolio/${project.slug}`,
      { title: project.data.title, description: project.data.summary },
    ])
  ),
};

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    // Vendored so builds don't depend on a font CDN
    fonts: ['./src/fonts/noto-sans-latin-400-normal.ttf', './src/fonts/noto-sans-latin-800-normal.ttf'],
    // Matches the dark theme's base-100/primary-secondary gradient look
    bgGradient: [
      [17, 24, 39],
      [31, 41, 55],
    ],
    border: { color: [129, 140, 248], width: 16, side: 'inline-start' },
    padding: 72,
    font: {
      title: {
        size: 72,
        // The 800-weight file registers as its own family, not as a weight of 'Noto Sans'
        families: ['Noto Sans ExtraBold', 'Noto Sans'],
        weight: 'ExtraBold',
        color: [243, 244, 246],
        lineHeight: 1.2,
      },
      description: {
        size: 36,
        weight: 'Normal',
        color: [209, 213, 219],
        lineHeight: 1.4,
      },
    },
  }),
});
