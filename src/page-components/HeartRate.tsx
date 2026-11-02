import type { HeartStatus } from '../lib/pulsoidClient';
import { useHeartRate } from '../lib/heartRateStore';
import { PulsoidWidgetFrame, type Skin } from './heartRateParts';

/**
 * Maan's live heart rate (Pulsoid): the compact footer readout in every skin.
 * Its siblings are HeartRateCard (the /about box) and HeartRateFloat (the
 * toggleable floating window); all three share one poller via
 * src/lib/heartRateStore.ts.
 *
 * With a token, /api/heartrate proxies Pulsoid's API and this renders a native
 * readout, hidden until a live reading arrives and again once the strap goes
 * quiet. Fallback: with no token, or once Pulsoid rejects it (BRO plan lapsed),
 * the proxy answers `mode: 'widget'` and this frames Pulsoid's free widget in
 * the skin's chrome; polling continues so the native readout returns by itself.
 *
 * The heart pulses at the actual BPM (animation-duration = 60/bpm s); each
 * skin's reduced-motion block stops it. No aria-live: announcing a number every
 * few seconds would be relentless.
 */

interface Props {
  skin: Skin;
  /** Server-resolved starting state (`initialHeartRate()` in src/lib/pulsoid.ts). */
  initial: HeartStatus;
}

export function HeartRate({ skin, initial }: Props) {
  const reading = useHeartRate(initial);

  if (reading.mode === 'offline') return null;
  if (reading.mode === 'widget') {
    if (skin === 'retro') return <div className="rt-heart rt-heart--widget"><PulsoidWidgetFrame src={reading.src} /></div>;
    if (skin === 'mandy') return <div className="md-heart md-heart--widget"><PulsoidWidgetFrame src={reading.src} /></div>;
    return <div className="mt-2 flex justify-center"><PulsoidWidgetFrame src={reading.src} /></div>;
  }

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

export default HeartRate;
