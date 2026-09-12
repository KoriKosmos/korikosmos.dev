export interface LastfmImage { '#text': string; size: string }
export interface LastfmTrack {
  name: string;
  artist: { '#text'?: string; name?: string };
  album: { '#text': string };
  image: LastfmImage[];
  url?: string;
  '@attr'?: { nowplaying?: string };
}
export interface LastfmArtist { name: string; url: string; image: LastfmImage[] }
export interface LastfmAlbum { name: string; url: string; artist: { name: string }; image: LastfmImage[] }
