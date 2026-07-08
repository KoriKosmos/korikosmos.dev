// The "now page" indie-web convention: a snapshot of what I'm up to right now.
// Edit NOW_UPDATED and the section content below whenever life changes — that's the whole point.
// See https://nownownow.com/about for the idea.

const NOW_UPDATED = new Date('2026-07-08');

interface NowTrack {
  name: string;
  artist: string;
  url?: string;
}

export interface NowPageProps {
  currentTrack?: NowTrack | null;
  isPlaying?: boolean;
}

export function NowPage({ currentTrack, isPlaying }: NowPageProps) {
  return (
    <section className="my-8 space-y-8">
      <header>
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent inline-block">
          Now
        </h1>
        <p className="mt-2 text-base-content/60">
          What I'm doing at this point in my life. Updated{' '}
          <time dateTime={NOW_UPDATED.toISOString().slice(0, 10)}>
            {NOW_UPDATED.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </time>
          . This is a{' '}
          <a
            href="https://nownownow.com/about"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary"
          >
            now page
          </a>
          .
        </p>
      </header>

      <div className="bg-base-200 rounded-xl p-6 shadow space-y-3">
        <h2 className="text-2xl font-bold">Working on</h2>
        <ul className="list-disc list-inside space-y-1 text-lg">
          <li>
            This site — rebuilt it on Astro + React islands, now polishing the details (you're looking at one of
            them).
          </li>
          <li>Tinkering with my home server and self-hosted services.</li>
          <li>Slowly growing the little <a href="/games" className="link link-primary">games hub</a> here.</li>
        </ul>
      </div>

      <div className="bg-base-200 rounded-xl p-6 shadow space-y-3">
        <h2 className="text-2xl font-bold">Listening to</h2>
        {currentTrack ? (
          <p className="text-lg">
            {isPlaying ? 'Right now: ' : 'Most recently: '}
            {currentTrack.url ? (
              <a
                href={currentTrack.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary font-semibold"
              >
                {currentTrack.name}
              </a>
            ) : (
              <span className="font-semibold">{currentTrack.name}</span>
            )}{' '}
            by {currentTrack.artist}
            {isPlaying && (
              <span className="ml-2 inline-block align-middle" aria-label="now playing">
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
              </span>
            )}
          </p>
        ) : (
          <p className="text-lg">A little bit of everything, always.</p>
        )}
        <p className="text-base-content/60">
          Live from my scrobbles — the full picture is on <a href="/tunes" className="link link-primary">Tunes</a>.
        </p>
      </div>

      <div className="bg-base-200 rounded-xl p-6 shadow space-y-3">
        <h2 className="text-2xl font-bold">Reading &amp; watching</h2>
        <ul className="list-disc list-inside space-y-1 text-lg">
          <li>Comics, manga, and character-driven animation — the usual rotation.</li>
          <li>Story-first games that reward slowing down.</li>
        </ul>
      </div>

      <p className="text-base-content/60">
        Want to know what I use to do all this? See <a href="/uses" className="link link-primary">/uses</a>.
      </p>
    </section>
  );
}

export default NowPage;
