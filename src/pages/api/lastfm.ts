import type { APIRoute } from 'astro';
import { getRecentTracks, getTopArtists, getTopAlbums } from '../../lib/lastfm';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const method = url.searchParams.get('method') || 'recent';
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  
  let data;

  try {
    switch (method) {
      case 'artists':
        data = await getTopArtists('7day', limit);
        break;
      case 'albums':
        data = await getTopAlbums('7day', limit);
        break;
      case 'recent':
      default:
        data = await getRecentTracks(limit);
        break;
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
