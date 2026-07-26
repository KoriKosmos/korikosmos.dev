// Retro (Web 1.0) dressing of /now. Same sections and links as
// page-components/NowPage.tsx, and the same NOW_UPDATED date — shared from
// src/data/now.ts so bumping it can't update only one skin. Formatted with an
// explicit UTC timezone so the two skins agree regardless of server locale.
//
// Rendered server-side with no client:* directive: static HTML only.

import { NOW_UPDATED } from '../data/now';

interface NowTrack {
  name: string;
  artist: string;
  url?: string;
}

interface Props {
  currentTrack?: NowTrack | null;
  isPlaying?: boolean;
}

export function RetroNowPage({ currentTrack, isPlaying }: Props) {
  return (
    <div className="rt-stack">
      <h1 className="rt-heading">
        <span className="rt-glow">~ * NOW * ~</span>
      </h1>

      <div className="rt-panel">
        <div className="rt-panel__title">WHAT_IM_DOING_RIGHT_NOW.HTM</div>
        <div className="rt-panel__body">
          <p style={{ marginBottom: '6px' }}>
            What I&rsquo;m doing at this point in my life. Updated{' '}
            <strong>
              <time dateTime={NOW_UPDATED.toISOString().slice(0, 10)}>
                {NOW_UPDATED.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                })}
              </time>
            </strong>
            . This is a{' '}
            <a href="https://nownownow.com/about" target="_blank" rel="noopener noreferrer">
              now page
            </a>
            .
          </p>
          <p className="rt-note" style={{ margin: 0 }}>
            &raquo; Hand-typed in Notepad. If it&rsquo;s out of date, that is also information about my life.
          </p>
        </div>
      </div>

      <div className="rt-hr"></div>

      {/* ---------------- Working on ---------------- */}
      <div className="rt-panel">
        <div className="rt-panel__title">Working on</div>
        <div className="rt-panel__body">
          <h2 className="rt-subhead" style={{ marginTop: 0 }}>
            Working on{' '}
            <img src="/retro/gfx/new.svg" alt="(new!)" width="36" height="16" className="rt-pixel" />
          </h2>
          <ul>
            <li>
              This site &mdash; rebuilt it on Astro + React islands, now polishing the details (you&rsquo;re looking at
              one of them).
            </li>
            <li>Tinkering with my home server and self-hosted services.</li>
            <li>
              Slowly growing the little <a href="/games">games hub</a> here.
            </li>
          </ul>
          <img
            className="rt-construction"
            src="/retro/gfx/construction.svg"
            alt="Under construction"
            width="180"
            height="60"
          />
          <p className="rt-note rt-center" style={{ margin: 0 }}>
            This page is, and will always be, under construction.
          </p>
        </div>
      </div>

      {/* ---------------- Listening to ---------------- */}
      <div className="rt-panel">
        <div className="rt-panel__title">Listening to</div>
        <div className="rt-panel__body">
          <img
            className="rt-blinkie"
            src="/retro/blinkies/nowplaying.svg"
            alt="Now playing"
            width="150"
            height="20"
          />

          <h2 className="rt-subhead" style={{ marginTop: '6px' }}>
            Listening to
          </h2>

          <div className="rt-inset">
            <p className="rt-mono" style={{ marginBottom: 0 }}>
              <span aria-hidden="true">♫ </span>
              {currentTrack ? (
                <>
                  {isPlaying ? 'Right now: ' : 'Most recently: '}
                  {currentTrack.url ? (
                    <a href={currentTrack.url} target="_blank" rel="noopener noreferrer">
                      <strong>{currentTrack.name}</strong>
                    </a>
                  ) : (
                    <strong>{currentTrack.name}</strong>
                  )}{' '}
                  by {currentTrack.artist}
                  {isPlaying ? <span className="rt-blink"> [ON AIR]</span> : null}
                </>
              ) : (
                'A little bit of everything, always.'
              )}
              <span aria-hidden="true"> ♫</span>
            </p>
          </div>

          <p style={{ marginTop: '8px', marginBottom: 0 }}>
            Live from my scrobbles &mdash; the full picture is on <a href="/tunes">Tunes</a>.
          </p>
          <p className="rt-note" style={{ margin: '4px 0 0' }}>
            (my MIDI collection is regrettably not scrobbled)
          </p>
        </div>
      </div>

      {/* ---------------- Reading & watching ---------------- */}
      <div className="rt-panel">
        <div className="rt-panel__title">Reading &amp; watching</div>
        <div className="rt-panel__body">
          <h2 className="rt-subhead" style={{ marginTop: 0 }}>
            Reading &amp; watching
          </h2>
          <ul>
            <li>Comics, manga, and character-driven animation &mdash; the usual rotation.</li>
            <li>Story-first games that reward slowing down.</li>
          </ul>
        </div>
      </div>

      <div className="rt-hr rt-hr--stars"></div>

      <div className="rt-panel">
        <div className="rt-panel__title rt-panel__title--plain">Related Pages</div>
        <div className="rt-panel__body rt-center">
          <p style={{ marginBottom: '8px' }}>
            Want to know what I use to do all this? See <a href="/uses">/uses</a>.
          </p>
          <p className="rt-row" style={{ justifyContent: 'center', margin: 0 }}>
            <a className="rt-btn" href="/uses">
              /uses
            </a>
            <a className="rt-btn" href="/tunes">
              Tunes
            </a>
            <a className="rt-btn" href="/games">
              Games
            </a>
            <a className="rt-btn rt-btn--primary" href="/guestbook">
              Sign my guestbook
            </a>
          </p>
        </div>
      </div>

      <p className="rt-center rt-note" style={{ margin: 0 }}>
        ヽ(・∀・)ﾉ Come back soon &mdash; &ldquo;now&rdquo; changes.
      </p>
    </div>
  );
}

export default RetroNowPage;
