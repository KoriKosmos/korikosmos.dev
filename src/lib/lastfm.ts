export const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';

const USER = import.meta.env.LASTFM_USER || process.env.LASTFM_USER;
const API_KEY = import.meta.env.LASTFM_API_KEY || process.env.LASTFM_API_KEY;

if (!USER || !API_KEY) {
  console.warn('Last.fm credentials missing in environment variables.');
}

async function fetchLastFm(method: string, params: Record<string, string | number> = {}) {
  if (!USER || !API_KEY) return null;

  const urlParams = new URLSearchParams({
    method,
    user: USER,
    api_key: API_KEY,
    format: 'json',
    ...params,
  });

  try {
    const response = await fetch(`${LASTFM_API_BASE}?${urlParams.toString()}`);
    if (!response.ok) {
      console.error(`Last.fm API error: ${response.status} ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Last.fm fetch error:', error);
    return null;
  }
}

export async function getRecentTracks(limit = 10) {
  const data = await fetchLastFm('user.getrecenttracks', { limit });
  return data?.recenttracks?.track || [];
}

export async function getTopArtists(period = '7day', limit = 5) {
  const data = await fetchLastFm('user.gettopartists', { period, limit });
  return data?.topartists?.artist || [];
}

export async function getTopAlbums(period = '7day', limit = 5) {
  const data = await fetchLastFm('user.gettopalbums', { period, limit });
  return data?.topalbums?.album || [];
}

// Helper to get the best image from Last.fm array
export function getBestImage(images: { '#text': string; size: string }[]) {
  if (!Array.isArray(images)) return '';
  const sizes = ['extralarge', 'large', 'medium', 'small'];
  for (const size of sizes) {
    const img = images.find((i) => i.size === size);
    if (img && img['#text']) return img['#text'];
  }
  return images[0]?.['#text'] || '';
}
