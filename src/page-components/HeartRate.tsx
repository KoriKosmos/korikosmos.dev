import { useEffect, useState } from 'react';
import type { HeartStatus } from '../lib/pulsoidClient';

/**
 * Maan's live heart rate (Pulsoid), rendered in the footer of every skin.
 *
 * With a token: polls /api/heartrate, a server proxy that holds the token and
 * shares one cached upstream answer between all visitors. Renders nothing until
 * a live reading arrives, and hides again once the monitor goes quiet, so a
 * switched-off strap just makes the widget disappear.
 *
 * Fallback: when there's no token, or Pulsoid rejects it (BRO plan lapsed), the
 * proxy answers `mode: 'widget'` and this frames Pulsoid's free widget instead,
 * in the skin's own chrome. Without a token that is the server-rendered
 * `initial` state and nothing polls; with one, polling continues so the native
 * readout comes back by itself once the token works again.
 *
 * The heart pulses at the actual BPM (animation-duration = 60/bpm s). Each
 * skin's reduced-motion block stops it. No aria-live: announcing a number
 * every few seconds would be relentless.
 */

type Skin = 'modern' | 'retro' | 'mandy';

const POLL_MS = 5_000;

interface Props {
  skin: Skin;
  /** Server-resolved starting state (`initialHeartRate()` in src/lib/pulsoid.ts). */
  initial: HeartStatus;
}

const OFFLINE: HeartStatus = { mode: 'offline' };

export function HeartRate({ skin, initial }: Props) {
  const [reading, setReading] = useState<HeartStatus>(initial);
  // A widget-only setup has no token, so there is nothing for the API to add.
  const polls = initial.mode !== 'widget';

  useEffect(() => {
    if (!polls) return;
    let cancelled = false;
    const poll = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch('/api/heartrate', { cache: 'no-store' });
        const next = response.ok ? await response.json() as HeartStatus : OFFLINE;
        if (!cancelled) setReading(next);
      } catch {
        if (!cancelled) setReading(OFFLINE);
      }
    };
    poll();
    const timer = window.setInterval(poll, POLL_MS);
    const onVisible = () => { if (!document.hidden) poll(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [polls]);

  if (reading.mode === 'offline') return null;
  if (reading.mode === 'widget') return <HeartWidget skin={skin} src={reading.src} />;

  const { bpm } = reading;
  const beat = { animationDuration: `${(60 / bpm).toFixed(3)}s` };
  const title = `Maan's heart rate, live from a chest strap via Pulsoid: ${bpm} beats per minute`;

  if (skin === 'retro') {
    return (
      <p className="rt-heart" title={title}>
        <span className="rt-heart__icon" style={beat} aria-hidden="true">♥</span>
        {' '}my heart rate:{' '}
        <span className="rt-heart__lcd">{String(bpm).padStart(3, '0')}</span> BPM
        {' '}<span className="rt-heart__live">LIVE</span>
      </p>
    );
  }

  if (skin === 'mandy') {
    return (
      <p className="md-heart" title={title}>
        <span className="md-heart__icon" style={beat} aria-hidden="true">♥</span>
        <span className="md-heart__label">heart rate</span>
        <span className="md-heart__bpm">{bpm}</span>
        <span className="md-heart__unit">bpm</span>
        <span className="md-heart__dot" aria-hidden="true" />
      </p>
    );
  }

  return (
    <p
      className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full border border-base-content/15 bg-base-200/60 px-3 py-1 text-xs text-base-content/70 backdrop-blur"
      title={title}
    >
      <span className="kk-heartbeat text-error" style={beat} aria-hidden="true">♥</span>
      <span>
        my heart rate: <span className="font-semibold tabular-nums text-base-content">{bpm}</span> bpm
      </span>
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full bg-error opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-error" />
      </span>
    </p>
  );
}

/**
 * Pulsoid's free widget. It draws at roughly 400×200 and is shown at half
 * scale, as the widget's own embed guide does. Cross-origin, so it can't be
 * recoloured: style it on pulsoid.net with a transparent background so it sits
 * on any skin. It is blank while the monitor is off.
 */
function HeartWidget({ skin, src }: { skin: Skin; src: string }) {
  const frame = (
    <span className="kk-heart-widget">
      <iframe
        src={src}
        title="Maan's live heart rate (Pulsoid widget)"
        loading="lazy"
        referrerPolicy="no-referrer"
        {...{ allowtransparency: 'true' }}
      />
    </span>
  );
  if (skin === 'retro') return <div className="rt-heart rt-heart--widget">{frame}</div>;
  if (skin === 'mandy') return <div className="md-heart md-heart--widget">{frame}</div>;
  return <div className="mt-2 flex justify-center">{frame}</div>;
}

export default HeartRate;
