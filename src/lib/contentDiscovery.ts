import type { CollectionEntry } from 'astro:content';

export interface DiscoveryState {
  query: string;
  sort: string;
  sourceOnly: boolean;
}

export function readDiscoveryState(params: URLSearchParams, kind: 'blog' | 'projects'): DiscoveryState {
  const orders = kind === 'blog' ? ['newest', 'oldest', 'title'] : ['title', 'title-desc'];
  const sort = params.get('sort') ?? orders[0];
  return {
    query: (params.get('q') ?? '').trim().slice(0, 120),
    sort: orders.includes(sort) ? sort : orders[0],
    sourceOnly: kind === 'projects' && params.get('source') === 'github',
  };
}

function normalise(text: string): string {
  return text.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function matches(query: string, ...text: string[]): boolean {
  const haystack = normalise(text.join(' '));
  return normalise(query).split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
}

const byTitle = (a: { data: { title: string } }, b: { data: { title: string } }) =>
  a.data.title.localeCompare(b.data.title, 'en-GB', { sensitivity: 'base', numeric: true });

export function discoverPosts(posts: CollectionEntry<'blog'>[], state: DiscoveryState) {
  return posts
    .filter(post => matches(state.query, post.data.title, post.data.description, post.body))
    .sort((a, b) => {
      if (state.sort === 'title') return byTitle(a, b);
      const dateOrder = a.data.pubDate.valueOf() - b.data.pubDate.valueOf();
      return (state.sort === 'oldest' ? dateOrder : -dateOrder) || byTitle(a, b);
    });
}

export function discoverProjects(projects: CollectionEntry<'projects'>[], state: DiscoveryState) {
  return projects
    .filter(project => (!state.sourceOnly || Boolean(project.data.github)) &&
      matches(state.query, project.data.title, project.data.summary, project.data.description, project.body))
    .sort((a, b) => (state.sort === 'title-desc' ? -1 : 1) * byTitle(a, b));
}
