import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../config';

// Newest first, with the self link and language feed readers ask for. Posts
// carry their description, not their body: the full text lives on the site.
export async function GET(context) {
  const posts = (await getCollection('blog')).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  const self = new URL('/rss.xml', context.site).href;
  return rss({
    title: `${SITE_TITLE} blog`,
    description: SITE_DESCRIPTION,
    site: context.site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>en-gb</language><atom:link href="${self}" rel="self" type="application/rss+xml" />`,
    trailingSlash: true,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
    })),
  });
}
