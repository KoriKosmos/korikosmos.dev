import { createAsyncCache } from './asyncCache';
import { BLOCKED_ITEMS } from './constants';
import { trackArtistName } from './lastfmTrack';
import type { LastfmAlbum, LastfmArtist, LastfmTrack } from './lastfmTypes';

export const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';
export const LASTFM_PERIODS = ['overall', '7day', '1month', '3month', '6month', '12month'] as const;
const RECENT_TTL = 15_000;
const CHART_TTL = 15 * 60_000;

export function readLastfmQuery(params: URLSearchParams) {
  const method = params.get('method') ?? 'recent';
  const rawLimit = params.get('limit') ?? '10';
  const period = params.get('period') ?? 'overall';
  if (!['recent', 'artists', 'albums'].includes(method)) throw new Error('Unknown Last.fm method.');
  if (!/^\d+$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 50) {
    throw new Error('Limit must be a whole number from 1 to 50.');
  }
  if (!(LASTFM_PERIODS as readonly string[]).includes(period)) throw new Error('Unknown Last.fm period.');
  return { method, limit: Number(rawLimit), period };
}

interface Options { user?: string; apiKey?: string; fetcher?: typeof fetch; now?: () => number }

export function createLastfmClient({ user, apiKey, fetcher = fetch, now = Date.now }: Options) {
  const requests = createAsyncCache<Record<string, any>>({ now });
  const artistLists = createAsyncCache<LastfmArtist[]>({ now, maxEntries: 64 });

  async function request(method: string, params: Record<string, string | number> = {}) {
    if (!user || !apiKey) throw new Error('Last.fm is not configured.');
    const key = JSON.stringify([method, Object.entries(params).sort(([a], [b]) => a.localeCompare(b))]);
    return requests.get(key, async () => {
      const query = new URLSearchParams({ method, user, api_key: apiKey, format: 'json' });
      for (const [name, value] of Object.entries(params)) query.set(name, String(value));
      const response = await fetcher(`${LASTFM_API_BASE}?${query}`, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`Last.fm returned HTTP ${response.status}.`);
      const data = await response.json();
      // Last.fm also reports failures as JSON inside an HTTP 200 response.
      if (!data || typeof data !== 'object' || data.error) throw new Error('Last.fm returned an API error.');
      const lists: Record<string, unknown> = {
        'user.getrecenttracks': data.recenttracks?.track,
        'user.gettopartists': data.topartists?.artist,
        'user.gettopalbums': data.topalbums?.album,
      };
      if (method.startsWith('user.') && !Array.isArray(lists[method])) throw new Error('Last.fm returned an invalid collection.');
      return data;
    }, method === 'user.getrecenttracks' ? RECENT_TTL : CHART_TTL);
  }

  async function getRecentTracks(limit = 10): Promise<LastfmTrack[]> {
    // /now, the Tunes SSR render and the live poll share the same small batch.
    const data = await request('user.getrecenttracks', { limit: Math.max(15, limit + 5) });
    const tracks: LastfmTrack[] = data.recenttracks.track;
    return tracks.filter((track, index) => index === 0 ||
      track.name !== tracks[index - 1].name || trackArtistName(track) !== trackArtistName(tracks[index - 1]))
      .slice(0, limit);
  }

  async function getTopArtists(period = '7day', limit = 5, enrich = true): Promise<LastfmArtist[]> {
    return artistLists.get(`${period}:${limit}:${enrich}`, async () => {
      const data = await request('user.gettopartists', { period, limit: limit + 5 });
      const artists: LastfmArtist[] = data.topartists.artist;
      const filtered = artists.filter(artist => !BLOCKED_ITEMS.includes(artist.name)).slice(0, limit);
      if (!enrich) return filtered;
      return Promise.all(filtered.map(async artist => {
        try {
          const info = await request('artist.getinfo', { artist: artist.name, autocorrect: 1 });
          return Array.isArray(info.artist?.image) ? { ...artist, image: info.artist.image } : artist;
        } catch {
          return artist;
        }
      }));
    }, CHART_TTL);
  }

  async function getTopAlbums(period = '7day', limit = 5): Promise<LastfmAlbum[]> {
    const data = await request('user.gettopalbums', { period, limit: limit + 5 });
    const albums: LastfmAlbum[] = data.topalbums.album;
    return albums.filter(album => !BLOCKED_ITEMS.includes(album.name) && !BLOCKED_ITEMS.includes(album.artist.name)).slice(0, limit);
  }

  return { getRecentTracks, getTopArtists, getTopAlbums };
}
