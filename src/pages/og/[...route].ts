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

type RGB = [number, number, number];

/**
 * Card families. Each section gets its own accent so blog posts, projects, and
 * the site card are distinguishable at a glance in a chat scrollback, while the
 * shared starfield geometry (one seed for all three — see gen-og-assets.mjs)
 * keeps them recognisably the same site.
 *
 * `gradient` is the vertical wash the starfield is drawn over; its lower stop is
 * nudged toward the accent hue rather than left a neutral grey.
 */
const VARIANTS: Record<string, { starfield: string; accent: RGB; gradient: RGB[] }> = {
  site: {
    starfield: './src/assets/og/starfield-site.png',
    accent: [129, 140, 248],
    gradient: [
      [15, 20, 36],
      [28, 30, 60],
    ],
  },
  blog: {
    starfield: './src/assets/og/starfield-blog.png',
    accent: [56, 189, 248],
    gradient: [
      [12, 21, 34],
      [18, 40, 62],
    ],
  },
  portfolio: {
    starfield: './src/assets/og/starfield-portfolio.png',
    accent: [192, 132, 252],
    gradient: [
      [20, 16, 36],
      [40, 26, 62],
    ],
  },
};

/** `path` is the `pages` key above, so the section is its first segment. */
const variantFor = (path: string) =>
  path.startsWith('blog/') ? VARIANTS.blog : path.startsWith('portfolio/') ? VARIANTS.portfolio : VARIANTS.site;

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (path, page) => {
    const variant = variantFor(path);

    return {
      title: page.title,
      description: page.description,
      // Vendored so builds don't depend on a font CDN
      fonts: ['./src/fonts/noto-sans-latin-400-normal.ttf', './src/fonts/noto-sans-latin-800-normal.ttf'],
      bgGradient: variant.gradient,
      // Drawn over the gradient (astro-og-canvas paints background, then border,
      // then this), so the starfield PNG carries alpha and the wash shows through.
      bgImage: { path: variant.starfield, fit: 'cover' as const },
      // The mark also pushes the text down out of the corner: astro-og-canvas
      // clamps the paragraph to a band just below the logo, so with no logo the
      // title is pinned at `padding` and the bottom half of the card is dead
      // space. With one, the text sits near the middle and the constellation
      // fills the rest.
      logo: { path: './src/assets/og/mark.png', size: [58] as [number] },
      border: { color: variant.accent, width: 14, side: 'inline-start' as const },
      padding: 68,
      font: {
        title: {
          size: 74,
          // The 800-weight file registers as its own family, not as a weight of 'Noto Sans'
          families: ['Noto Sans ExtraBold', 'Noto Sans'],
          weight: 'ExtraBold' as const,
          color: [246, 247, 251] as RGB,
          lineHeight: 1.15,
        },
        description: {
          size: 34,
          weight: 'Normal' as const,
          color: [186, 196, 214] as RGB,
          lineHeight: 1.45,
        },
      },
    };
  },
});
