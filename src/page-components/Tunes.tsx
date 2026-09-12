import { useEffect, useRef, useState } from "react";
import { getBestImage } from "../lib/images";
import { BLOCKED_ITEMS } from "../lib/constants";
import { trackArtistName } from '../lib/lastfmTrack';
import type { LastfmTrack as Track, LastfmArtist as Artist, LastfmAlbum as Album } from '../lib/lastfmTypes';

interface Props {
  recentTracks: Track[];
  initialArtists: Artist[];
  initialAlbums: Album[];
}

const PERIOD_MAP: Record<string, string> = {
  overall: "All Time",
  "12month": "Last Year",
  "7day": "Last Week",
};
const MUSIC_PLACEHOLDER = '/placeholder-music.svg';

function filterArtists(artists: Artist[]) {
  return artists
    .filter(artist => !BLOCKED_ITEMS.some(blocked => artist.name.toLowerCase().includes(blocked.toLowerCase())))
    .slice(0, 5);
}

function filterAlbums(albums: Album[]) {
  return albums
    .filter(album => !BLOCKED_ITEMS.some(blocked =>
      album.name.toLowerCase().includes(blocked.toLowerCase()) ||
      album.artist.name.toLowerCase().includes(blocked.toLowerCase())))
    .slice(0, 5);
}

export function Tunes({ recentTracks, initialArtists, initialAlbums }: Props) {
  const [artists, setArtists] = useState(() => filterArtists(initialArtists));
  const [albums, setAlbums] = useState(() => filterAlbums(initialAlbums));
  const [activePeriod, setActivePeriod] = useState('overall');
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(false);
  const [periodRetry, setPeriodRetry] = useState(0);
  const [tracks, setTracks] = useState(recentTracks);
  const [refreshError, setRefreshError] = useState(false);
  const dataCache = useRef(new Map<string, { artists: Artist[]; albums: Album[] }>());

  // Each selection owns its request and cleanup. A slower previous selection
  // cannot replace the active period or clear its loading state.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setListError(false);

    const apply = (data: { artists: Artist[]; albums: Album[] }) => {
      setArtists(filterArtists(data.artists));
      setAlbums(filterAlbums(data.albums));
    };
    const cached = dataCache.current.get(activePeriod);
    if (cached) {
      apply(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    async function load() {
      try {
        const [artistsRes, albumsRes] = await Promise.all([
          fetch(`/api/lastfm?method=artists&period=${activePeriod}&limit=5`, { signal: controller.signal }),
          fetch(`/api/lastfm?method=albums&period=${activePeriod}&limit=5`, { signal: controller.signal }),
        ]);
        if (!artistsRes.ok || !albumsRes.ok) throw new Error('Music data unavailable');
        const [artists, albums] = await Promise.all([artistsRes.json(), albumsRes.json()]);
        if (!Array.isArray(artists) || !Array.isArray(albums)) throw new Error('Invalid music data');
        if (!cancelled) {
          const data = { artists, albums };
          dataCache.current.set(activePeriod, data);
          apply(data);
        }
      } catch {
        if (!cancelled) setListError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; controller.abort(); };
  }, [activePeriod, periodRetry]);

  // Schedule after completion to avoid overlapping polls. Hidden tabs make no
  // requests, and returning to the page refreshes immediately.
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active: AbortController | null = null;

    function schedule() {
      clearTimeout(timer);
      if (!disposed && !document.hidden) timer = setTimeout(() => void poll(), 30_000);
    }
    async function poll() {
      if (disposed || document.hidden || active) return;
      clearTimeout(timer);
      const controller = new AbortController();
      active = controller;
      try {
        const response = await fetch('/api/lastfm?method=recent&limit=10', { signal: controller.signal });
        if (!response.ok) throw new Error('Music updates unavailable');
        const next = await response.json();
        if (!Array.isArray(next)) throw new Error('Invalid music updates');
        if (!disposed && !controller.signal.aborted) {
          // The same track can stop playing without changing its name.
          setTracks(next);
          setRefreshError(false);
        }
      } catch {
        if (!disposed && !controller.signal.aborted) setRefreshError(true);
      } finally {
        if (active === controller) { active = null; schedule(); }
      }
    }
    const onVisibility = () => {
      clearTimeout(timer);
      if (document.hidden) {
        active?.abort();
        active = null;
      } else {
        void poll();
      }
    };
    const onOnline = () => { if (!document.hidden) void poll(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    schedule();
    return () => {
      disposed = true;
      clearTimeout(timer);
      active?.abort();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  const currentTrack = tracks[0];
  const heroTrackName = currentTrack?.name || 'Nothing playing';
  const heroArtistName = trackArtistName(currentTrack);
  const heroAlbumName = currentTrack?.album['#text'] || '';
  const heroImg = getBestImage(currentTrack?.image ?? []) || MUSIC_PLACEHOLDER;
  const heroIsPlaying = currentTrack?.['@attr']?.nowplaying === 'true';
  const loadingArtists = loading;
  const loadingAlbums = loading;

  const periodLabel = PERIOD_MAP[activePeriod];

  return (
    <div className="space-y-12">
      {/* Hero Section: Now Playing / Most Recent */}
      {/* isolate keeps the hero's internal z-layers from competing with page chrome */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-base-200 shadow-xl min-h-[400px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover opacity-30 blur-3xl scale-110" />
          <div className="absolute inset-0 bg-base-100/50"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 w-full mx-auto">
          <div className="relative group">
            <img
              src={heroImg}
              alt={heroTrackName}
              width={256}
              height={256}
              decoding="async"
              className="w-64 h-64 rounded-2xl shadow-2xl object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className={`absolute -top-4 -right-4 bg-accent text-accent-content text-xs font-bold px-3 py-1 rounded-full shadow-lg motion-safe:animate-bounce ${heroIsPlaying ? "" : "hidden"}`}
            >
              NOW PLAYING
            </div>
          </div>

          <div className="text-center md:text-left space-y-4 flex-1">
            <h2 className="text-sm uppercase tracking-widest text-secondary font-semibold">
              {heroIsPlaying ? "Currently Vibing To" : "Last Listened"}
            </h2>
            <h1 className="text-4xl md:text-6xl font-black leading-tight break-words bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              {heroTrackName}
            </h1>
            <p className="text-xl md:text-2xl text-base-content/80 font-medium">{heroArtistName}</p>
            <div className="text-sm text-base-content/60">{heroAlbumName}</div>
          </div>
        </div>
      </section>
      {refreshError && <p role="status" className="text-sm text-base-content/70">Live updates are temporarily unavailable. Keeping the last result and retrying shortly.</p>}
      {listError && <div role="alert" className="flex flex-wrap items-center gap-3 text-sm"><span>Could not load this period.</span><button type="button" className="btn btn-sm btn-outline" onClick={() => setPeriodRetry(value => value + 1)}>Retry charts</button></div>}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_min-content] gap-6 items-stretch">
        {/* Recent History */}
        <section className="bg-base-200/50 backdrop-blur-sm p-6 rounded-3xl border border-base-content/5 flex flex-col h-full hover:bg-base-200/70 transition-colors">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-primary">scrobbles</span>
            <span className="text-base-content/40 text-sm font-normal">History</span>
          </h2>
          <div className="space-y-4 flex-1">
            {tracks.slice(1, 6).map((track, i) => (
              <div
                key={i}
                className="flex items-center gap-4 group p-3 rounded-2xl hover:bg-base-100/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border border-transparent hover:border-base-content/5"
              >
                <img
                  src={getBestImage(track.image) || MUSIC_PLACEHOLDER}
                  alt={track.name}
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
                  className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:rotate-6 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold truncate group-hover:text-primary transition-colors">{track.name}</h3>
                  <p className="text-sm text-base-content/60 truncate">{trackArtistName(track)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Artists */}
        <section className="bg-base-200/50 backdrop-blur-sm p-6 rounded-3xl border border-base-content/5 relative group/section flex flex-col h-full hover:bg-base-200/70 transition-colors">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-secondary">artists</span>
            <span className="text-base-content/40 text-sm font-normal">{periodLabel}</span>
          </h2>
          {loadingArtists && (
            <div className="absolute inset-0 bg-base-200/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl">
              <span className="loading loading-bars loading-lg text-secondary"></span>
            </div>
          )}
          <div className="flex flex-col gap-3 flex-1 justify-center">
            {listError ? (
              <p className="text-center p-4 text-base-content/60">Artist data is unavailable.</p>
            ) : (
              artists.map((artist, i) => {
                const imgUrl = getBestImage(artist.image);
                return (
                  <a
                    key={artist.name}
                    href={artist.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-3 rounded-2xl bg-base-100/50 hover:bg-base-100 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md group/item border border-transparent hover:border-secondary/20"
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={artist.name}
                        width={48}
                        height={48}
                        loading="lazy"
                        decoding="async"
                        className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover/item:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-neutral text-neutral-content flex items-center justify-center font-bold text-sm shadow-sm group-hover/item:scale-110 transition-transform">
                        #{i + 1}
                      </div>
                    )}
                    <span className="font-bold text-lg truncate flex-1">{artist.name}</span>
                    <span className="opacity-0 group-hover/item:opacity-100 transition-opacity text-secondary font-bold">
                      #{i + 1}
                    </span>
                  </a>
                );
              })
            )}
          </div>
        </section>

        {/* Controls (Stacked Bubbles) */}
        <div className="flex flex-col gap-4 min-w-[160px] h-full">
          {Object.entries(PERIOD_MAP).map(([period, label]) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              aria-pressed={activePeriod === period}
              className={`flex-1 rounded-3xl bg-base-100 border border-base-content/10 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 font-bold text-lg period-btn flex items-center justify-center gap-2 group relative overflow-hidden ${activePeriod === period ? "active" : ""}`}
              data-period={period}
            >
              <span className="relative z-10">{label}</span>
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          ))}
        </div>
      </div>

      {/* Top Albums (Full Width Below) */}
      <section className="bg-base-200/50 backdrop-blur-sm p-8 rounded-3xl border border-base-content/5 relative group/section hover:bg-base-200/70 transition-colors">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <span className="text-accent">albums</span>
          <span className="text-base-content/40 text-sm font-normal">{periodLabel}</span>
        </h2>
        {loadingAlbums && (
          <div className="absolute inset-0 bg-base-200/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl">
            <span className="loading loading-bars loading-lg text-accent"></span>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {listError ? (
            <p className="text-center p-4 text-base-content/60 col-span-full">Album data is unavailable.</p>
          ) : (
            albums.map((album, i) => (
              <a
                key={`${album.artist.name}-${album.name}`}
                href={album.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square perspective-1000"
              >
                <div className="w-full h-full relative preserve-3d group-hover:rotate-y-12 transition-transform duration-500">
                  <img
                    src={getBestImage(album.image) || MUSIC_PLACEHOLDER}
                    alt={album.name}
                    width={240}
                    height={240}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full rounded-2xl object-cover shadow-lg group-hover:shadow-2xl transition-all duration-300"
                    title={`${album.name} by ${album.artist.name}`}
                  />
                  <div className="absolute -bottom-4 md:-bottom-8 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <span className="text-xs font-bold bg-base-100/90 px-3 py-1 rounded-full shadow-sm truncate max-w-[90%] inline-block">
                      #{i + 1} {album.name}
                    </span>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </section>

      <style>{`
        .period-btn.active[data-period="overall"] {
          background-color: oklch(var(--p));
          color: oklch(var(--pc));
          transform: scale(1.05);
          box-shadow: 0 0 20px -5px oklch(var(--p));
          border-color: transparent;
        }
        .period-btn.active[data-period="12month"] {
          background-color: oklch(var(--s));
          color: oklch(var(--sc));
          transform: scale(1.05);
          box-shadow: 0 0 20px -5px oklch(var(--s));
          border-color: transparent;
        }
        .period-btn.active[data-period="7day"] {
          background-color: oklch(var(--a));
          color: oklch(var(--ac));
          transform: scale(1.05);
          box-shadow: 0 0 20px -5px oklch(var(--a));
          border-color: transparent;
        }
        .preserve-3d { transform-style: preserve-3d; }
      `}</style>
    </div>
  );
}
