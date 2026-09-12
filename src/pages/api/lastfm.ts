import type { APIRoute } from 'astro';
import { getRecentTracks, getTopArtists, getTopAlbums } from '../../lib/lastfm';
import { readLastfmQuery } from '../../lib/lastfmClient';

const json = (data: unknown, status: number, cacheControl: string, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': cacheControl, ...extraHeaders },
});

export const GET: APIRoute = async ({ url }) => {
  let query;
  try {
    query = readLastfmQuery(url.searchParams);
  } catch (error) {
    return json({ error: (error as Error).message }, 400, 'no-store');
  }

  try {
    const { method, period, limit } = query;
    const data = method === 'artists' ? await getTopArtists(period, limit)
      : method === 'albums' ? await getTopAlbums(period, limit)
      : await getRecentTracks(limit);
    return json(data, 200, method === 'recent'
      ? 'public, max-age=15'
      : 'public, max-age=900, stale-while-revalidate=60');
  } catch {
    // Do not cache an outage as a successful empty list, or log credential-bearing URLs.
    return json({ error: 'Music updates are temporarily unavailable.' }, 503, 'no-store', { 'Retry-After': '30' });
  }
};
