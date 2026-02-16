export { getBestImage } from './images';
import { BLOCKED_ITEMS } from './constants';

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
  // Fetch more than needed to account for filtering
  const data = await fetchLastFm('user.getrecenttracks', { limit: limit + 5 });
  const tracks = data?.recenttracks?.track || [];

  if (!Array.isArray(tracks)) return [];

  // Filter out consecutive duplicates (scrobbling the same song repeatedly)
  const uniqueTracks = tracks.filter((track: any, index: number) => {
    if (index === 0) return true;
    const prev = tracks[index - 1];
    return track.name !== prev.name || track.artist['#text'] !== prev.artist['#text'];
  });

  return uniqueTracks.slice(0, limit);
}

const CACHE = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes
const CACHE_VERSION = 'v1';

export async function getTopArtists(period = '7day', limit = 5, enrich = true) {
  const cacheKey = `artist-${period}-${limit}-${enrich}-${CACHE_VERSION}`;
  const now = Date.now();

  if (CACHE.has(cacheKey)) {
    const { data, timestamp } = CACHE.get(cacheKey)!;
    if (now - timestamp < CACHE_TTL) {
      return data;
    }
  }

  // Fetch extra to account for filtering
  const data = await fetchLastFm('user.gettopartists', { period, limit: limit + 5 });
  const rawArtists = data?.topartists?.artist || [];

  // Filter blocked items
  const artists = rawArtists.filter((a: any) => !BLOCKED_ITEMS.includes(a.name));

  if (!enrich) {
     return artists.slice(0, limit);
  }

  // Parallel fetch to enrich with proper images from artist.getinfo
  const enrichedArtists = await Promise.all(
    artists.slice(0, limit).map(async (artist: any) => {
      try {
        const infoData = await fetchLastFm('artist.getinfo', {
            artist: artist.name,
            autocorrect: 1
        });

        if (infoData?.artist?.image) {
            return { ...artist, image: infoData.artist.image };
        }
        return artist;
      } catch (e) {
        console.error(`Failed to enrich info for ${artist.name}`);
        return artist;
      }
    })
  );

  CACHE.set(cacheKey, { data: enrichedArtists, timestamp: now });
  return enrichedArtists;
}

export async function getTopAlbums(period = '7day', limit = 5) {
  // Fetch extra to account for filtering
  const data = await fetchLastFm('user.gettopalbums', { period, limit: limit + 5 });
  const albums = data?.topalbums?.album || [];

  const filtered = albums.filter((album: any) =>
    !BLOCKED_ITEMS.includes(album.name) &&
    !BLOCKED_ITEMS.includes(album.artist.name)
  );

  return filtered.slice(0, limit);
}
