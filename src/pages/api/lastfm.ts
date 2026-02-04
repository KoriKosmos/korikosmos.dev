import type { APIRoute } from 'astro';
import { getRecentTracks, getTopArtists, getTopAlbums } from '../../lib/lastfm';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const method = url.searchParams.get('method') || 'recent';
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const period = url.searchParams.get('period') || 'overall';
  
  let data;

  try {
    let cacheControl = 'public, max-age=60, stale-while-revalidate=30';
    
    switch (method) {
      case 'artists':
        data = await getTopArtists(period, limit);
        cacheControl = 'public, max-age=3600, stale-while-revalidate=1800';
        break;
      case 'albums':
        data = await getTopAlbums(period, limit);
        cacheControl = 'public, max-age=3600, stale-while-revalidate=1800';
        break;
      case 'recent':
      default:
        data = await getRecentTracks(limit);
        // Short cache for recent tracks to allow near-realtime updates
        cacheControl = 'public, max-age=30, stale-while-revalidate=15';
        break;
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': cacheControl
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
