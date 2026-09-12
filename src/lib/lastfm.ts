export { getBestImage } from './images';
export { LASTFM_API_BASE } from './lastfmClient';
import { createLastfmClient } from './lastfmClient';

// Server-only credentials. Neither this module nor the client factory is an island import.
const client = createLastfmClient({
  user: import.meta.env.LASTFM_USER || process.env.LASTFM_USER,
  apiKey: import.meta.env.LASTFM_API_KEY || process.env.LASTFM_API_KEY,
});

export const { getRecentTracks, getTopArtists, getTopAlbums } = client;
