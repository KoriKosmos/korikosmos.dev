import { useEffect, useRef, useState } from "react";
import { getBestImage } from "../lib/images";
import { BLOCKED_ITEMS } from "../lib/constants";

interface LastfmImage {
  "#text": string;
  size: string;
}

interface Track {
  name: string;
  artist: { "#text": string };
  album: { "#text": string };
  image: LastfmImage[];
  url?: string;
  "@attr"?: { nowplaying?: string };
}

interface Artist {
  name: string;
  url: string;
  image: LastfmImage[];
}

interface Album {
  name: string;
  url: string;
  artist: { name: string };
  image: LastfmImage[];
}

interface Props {
  recentTracks: Track[];
  initialArtists: Artist[];
  initialAlbums: Album[];
  currentTrack: Track | undefined;
  isPlaying: boolean;
}

const PERIOD_MAP: Record<string, string> = {
  overall: "All Time",
  "12month": "Last Year",
  "7day": "Last Week",
};

function filterArtists(artists: Artist[]) {
  return artists
    .filter((artist) => !BLOCKED_ITEMS.some((blocked) => artist.name.toLowerCase().includes(blocked.toLowerCase())))
    .slice(0, 5);
}

function filterAlbums(albums: Album[]) {
  return albums
    .filter(
      (album) =>
        !BLOCKED_ITEMS.some(
          (blocked) =>
            album.name.toLowerCase().includes(blocked.toLowerCase()) ||
            album.artist.name.toLowerCase().includes(blocked.toLowerCase()),
        ),
    )
    .slice(0, 5);
}

export function Tunes({ recentTracks, initialArtists, initialAlbums, currentTrack, isPlaying }: Props) {
  const [artists, setArtists] = useState(() => filterArtists(initialArtists));
  const [albums, setAlbums] = useState(() => filterAlbums(initialAlbums));
  const [activePeriod, setActivePeriod] = useState("overall");
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [listError, setListError] = useState(false);

  const [heroTrackName, setHeroTrackName] = useState(currentTrack?.name || "Nothing playing");
  const [heroArtistName, setHeroArtistName] = useState(currentTrack?.artist["#text"] || "");
  const [heroAlbumName, setHeroAlbumName] = useState(currentTrack?.album["#text"] || "");
  const [heroImg, setHeroImg] = useState(getBestImage(currentTrack?.image ?? []) || "/placeholder-music.png");
  const [heroIsPlaying, setHeroIsPlaying] = useState(isPlaying);

  const dataCache = useRef(new Map<string, { artists: Artist[]; albums: Album[] }>());

  async function fetchData(period: string) {
    if (dataCache.current.has(period)) return dataCache.current.get(period)!;

    const [artistsRes, albumsRes] = await Promise.all([
      fetch(`/api/lastfm?method=artists&period=${period}&limit=10`),
      fetch(`/api/lastfm?method=albums&period=${period}&limit=10`),
    ]);

    if (!artistsRes.ok || !albumsRes.ok) {
      throw new Error("Failed to fetch Last.fm data");
    }

    const data = { artists: await artistsRes.json(), albums: await albumsRes.json() };
    dataCache.current.set(period, data);
    return data;
  }

  // Hydrate 'overall' with enriched images from API, then prefetch other periods
  useEffect(() => {
    fetchData("overall")
      .then(({ artists }) => setArtists(filterArtists(artists)))
      .catch(() => {});

    const timeoutId = setTimeout(async () => {
      for (const p of Object.keys(PERIOD_MAP).filter((p) => p !== "overall")) {
        await fetchData(p);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, []);

  async function handlePeriodClick(period: string) {
    setActivePeriod(period);
    setListError(false);
    setLoadingArtists(true);
    setLoadingAlbums(true);

    try {
      const { artists, albums } = await fetchData(period);
      setArtists(filterArtists(artists));
      setAlbums(filterAlbums(albums));
    } catch (error) {
      console.error("Failed to fetch data", error);
      setListError(true);
    } finally {
      setLoadingArtists(false);
      setLoadingAlbums(false);
    }
  }

  // Client-side polling for the hero "now playing" section
  const heroKeyRef = useRef(`${heroTrackName}-${heroArtistName}`);

  useEffect(() => {
    async function updateNowPlaying() {
      try {
        const res = await fetch(`/api/lastfm?limit=1&t=${Date.now()}`);
        const data = await res.json();
        const track: Track | undefined = data[0];
        if (!track) return;

        const newKey = `${track.name}-${track.artist["#text"]}`;
        if (heroKeyRef.current === newKey) return;
        heroKeyRef.current = newKey;

        setHeroTrackName(track.name);
        setHeroArtistName(track.artist["#text"]);
        setHeroAlbumName(track.album["#text"]);
        setHeroImg(getBestImage(track.image) || "/placeholder-music.png");
        setHeroIsPlaying(track["@attr"]?.nowplaying === "true");
      } catch (e) {
        console.error("Failed to update now playing", e);
      }
    }

    const intervalId = setInterval(updateNowPlaying, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const periodLabel = PERIOD_MAP[activePeriod];

  return (
    <div className="space-y-12">
      {/* Hero Section: Now Playing / Most Recent */}
      <section className="relative overflow-hidden rounded-3xl bg-base-200 shadow-xl min-h-[400px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover opacity-30 blur-3xl scale-110" />
          <div className="absolute inset-0 bg-base-100/50"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 w-full mx-auto">
          <div className="relative group">
            <img
              src={heroImg}
              alt={heroTrackName}
              className="w-64 h-64 rounded-2xl shadow-2xl object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className={`absolute -top-4 -right-4 bg-accent text-accent-content text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce ${heroIsPlaying ? "" : "hidden"}`}
            >
              NOW PLAYING
            </div>
          </div>

          <div className="text-center md:text-left space-y-4 flex-1">
            <h2 className="text-sm uppercase tracking-widest text-secondary font-semibold">
              {heroIsPlaying ? "Currently Vibing To" : "Last Listened"}
            </h2>
            <h1 className="text-4xl md:text-6xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              {heroTrackName}
            </h1>
            <p className="text-xl md:text-2xl text-base-content/80 font-medium">{heroArtistName}</p>
            <div className="text-sm text-base-content/60">{heroAlbumName}</div>
          </div>
        </div>
      </section>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_min-content] gap-6 items-stretch">
        {/* Recent History */}
        <section className="bg-base-200/50 backdrop-blur-sm p-6 rounded-3xl border border-base-content/5 flex flex-col h-full hover:bg-base-200/70 transition-colors">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-primary">scrobbles</span>
            <span className="text-base-content/40 text-sm font-normal">History</span>
          </h2>
          <div className="space-y-4 flex-1">
            {recentTracks.slice(1, 6).map((track, i) => (
              <div
                key={i}
                className="flex items-center gap-4 group p-3 rounded-2xl hover:bg-base-100/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border border-transparent hover:border-base-content/5"
              >
                <img
                  src={getBestImage(track.image)}
                  alt={track.name}
                  className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:rotate-6 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold truncate group-hover:text-primary transition-colors">{track.name}</h3>
                  <p className="text-sm text-base-content/60 truncate">{track.artist["#text"]}</p>
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
              <p className="text-center p-4 text-base-content/60">Failed to load data. Try again later.</p>
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
              onClick={() => handlePeriodClick(period)}
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
            <p className="text-center p-4 text-base-content/60 col-span-full">Failed to load data. Try again later.</p>
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
                    src={getBestImage(album.image)}
                    alt={album.name}
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
