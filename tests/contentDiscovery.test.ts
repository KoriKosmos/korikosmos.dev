import assert from 'node:assert/strict';
import test from 'node:test';
import type { CollectionEntry } from 'astro:content';
import { discoverPosts, discoverProjects, readDiscoveryState } from '../src/lib/contentDiscovery';

const posts = [
  { slug: 'old', body: 'A café and a homelab', data: { title: 'Old notes', description: 'Linux', pubDate: new Date('2024-01-01') } },
  { slug: 'new', body: 'React islands', data: { title: 'New notes', description: 'Astro', pubDate: new Date('2026-01-01') } },
] as CollectionEntry<'blog'>[];

test('search matches all words across metadata and body, including accents', () => {
  const state = readDiscoveryState(new URLSearchParams('q=linux+CAFE'), 'blog');
  assert.deepEqual(discoverPosts(posts, state).map(post => post.slug), ['old']);
  assert.equal(discoverPosts(posts, { ...state, query: 'linux react' }).length, 0);
});

test('sorting does not mutate the content collection', () => {
  const state = readDiscoveryState(new URLSearchParams(), 'blog');
  assert.deepEqual(discoverPosts(posts, state).map(post => post.slug), ['new', 'old']);
  assert.deepEqual(discoverPosts(posts, { ...state, sort: 'oldest' }).map(post => post.slug), ['old', 'new']);
  assert.deepEqual(posts.map(post => post.slug), ['old', 'new']);
});

test('URL state rejects unknown sorting and bounds search length', () => {
  const state = readDiscoveryState(new URLSearchParams({ q: 'x'.repeat(200), sort: 'nope', source: 'github' }), 'blog');
  assert.equal(state.query.length, 120);
  assert.equal(state.sort, 'newest');
  assert.equal(state.sourceOnly, false);
});

test('portfolio combines text search, source filtering, and reverse title order', () => {
  const projects = [
    { slug: 'a', body: '', data: { title: 'Astro', summary: 'Site', description: 'Website', github: 'https://github.com/example/a' } },
    { slug: 'b', body: '', data: { title: 'Beta', summary: 'Site', description: 'Experiment' } },
    { slug: 'z', body: 'Website', data: { title: 'Zebra', summary: 'App', description: 'Game', github: 'https://github.com/example/z' } },
  ] as CollectionEntry<'projects'>[];
  const state = readDiscoveryState(new URLSearchParams('q=site&source=github&sort=title-desc'), 'projects');
  assert.deepEqual(discoverProjects(projects, state).map(project => project.slug), ['z', 'a']);
  assert.equal(discoverProjects(projects, { ...state, query: 'nothing' }).length, 0);
});
