// Mandy-mode /now. Same sections, links and NOW_UPDATED date as
// page-components/NowPage.tsx and retro-components/RetroNowPage.tsx.
//
// This is the THIRD copy of the /now prose (modern, retro, Mandy) — the prose is
// duplicated per skin by design, so editing /now means editing all three, then
// bumping NOW_UPDATED in src/data/now.ts. The date is formatted in UTC so all
// three skins agree regardless of server locale.

import { NOW_UPDATED } from '../data/now';

interface NowTrack {
  name: string;
  artist: string;
  url?: string;
}

export interface MandyNowPageProps {
  currentTrack?: NowTrack | null;
  isPlaying?: boolean;
}

export function MandyNowPage({ currentTrack, isPlaying }: MandyNowPageProps) {
  return (
    <>
      <section className="md-section md-section--first" aria-labelledby="md-now-title">
        <div className="md-section__head">
          <h1 className="md-section__title" id="md-now-title">Now</h1>
          <span className="md-section__tag">
            updated{' '}
            <time dateTime={NOW_UPDATED.toISOString().slice(0, 10)}>
              {NOW_UPDATED.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </time>
          </span>
        </div>
        <div className="md-section__body">
          <p>
            What I&rsquo;m doing at this point in my life. This is a{' '}
            <a href="https://nownownow.com/about" target="_blank" rel="noopener noreferrer">
              now page
            </a>
            .
          </p>
        </div>
      </section>

      <section className="md-section" aria-labelledby="md-now-working">
        <div className="md-section__head">
          <h2 className="md-section__title" id="md-now-working">Working on</h2>
          <span className="md-section__tag">in progress</span>
        </div>
        <ul className="md-list">
          <li>
            This site &mdash; rebuilt it on Astro + React islands, now polishing the details (you&rsquo;re looking at
            one of them).
          </li>
          <li>Tinkering with my home server and self-hosted services.</li>
          <li>
            Slowly growing the little <a href="/games">games hub</a> here.
          </li>
        </ul>
      </section>

      <section className="md-section" aria-labelledby="md-now-listening">
        <div className="md-section__head">
          <h2 className="md-section__title" id="md-now-listening">Listening to</h2>
          <span className="md-section__tag">{isPlaying ? 'on air' : 'last scrobble'}</span>
        </div>
        <div className="md-entry">
          {currentTrack ? (
            <>
              <div className="md-entry__meta">
                <span>
                  {isPlaying && (
                    <span
                      className="md-blink"
                      style={{ display: 'inline-block', background: 'var(--md-accent)', marginRight: '0.5rem' }}
                      aria-hidden="true"
                    ></span>
                  )}
                  {isPlaying ? 'Right now' : 'Most recently'}
                </span>
              </div>
              <p className="md-entry__title">
                {currentTrack.url ? (
                  <a href={currentTrack.url} target="_blank" rel="noopener noreferrer">
                    {currentTrack.name}
                  </a>
                ) : (
                  currentTrack.name
                )}
              </p>
              <p>by {currentTrack.artist}</p>
            </>
          ) : (
            <p className="md-entry__title">A little bit of everything, always.</p>
          )}
        </div>
        <p className="md-note">
          Live from my scrobbles &mdash; the full picture is on <a href="/tunes">Tunes</a>.
        </p>
      </section>

      <section className="md-section" aria-labelledby="md-now-reading">
        <div className="md-section__head">
          <h2 className="md-section__title" id="md-now-reading">Reading &amp; watching</h2>
          <span className="md-section__tag">the rotation</span>
        </div>
        <ul className="md-list">
          <li>Comics, manga, and character-driven animation &mdash; the usual rotation.</li>
          <li>Story-first games that reward slowing down.</li>
        </ul>
        <p className="md-note" style={{ marginTop: '2rem' }}>
          Want to know what I use to do all this? See <a href="/uses">/uses</a>.
        </p>
      </section>
    </>
  );
}

export default MandyNowPage;
