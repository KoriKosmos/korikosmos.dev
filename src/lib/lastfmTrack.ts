import type { LastfmTrack } from './lastfmTypes';

export function trackArtistName(track: LastfmTrack | undefined): string {
  return track?.artist?.['#text'] || track?.artist?.name || '';
}
