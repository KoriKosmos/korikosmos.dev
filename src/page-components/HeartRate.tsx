import type { HeartStatus } from '../lib/heartRateTypes';
import { useHeartRate } from '../lib/heartRateStore';
import { MandyBpm, PulsoidWidgetFrame, readingView, type Skin } from './heartRateParts';

/**
 * Maan's heart rate: the compact footer readout in every skin. Its siblings
 * are HeartRateCard (the /about box) and HeartRateFloat (the toggleable
 * floating window); all three share one poller via src/lib/heartRateStore.ts.
 *
 * /api/heartrate serves my Health Display server's merged reading (phone,
 * watch, rings, Pulsoid), or Pulsoid directly when that isn't available. This
 * renders a native readout, hidden while there's no reading at all. A `recent`
 * reading (the newest watch/ring sample, up to 15 minutes old) is shown muted,
 * as "~72 bpm · 5 min ago", with a still heart and no live marker. Fallback:
 * when only Pulsoid's free widget is available the proxy answers
 * `mode: 'widget'` and this frames it in the skin's chrome.
 *
 * A live heart pulses at the actual BPM (animation-duration = 60/bpm s); each
 * skin's reduced-motion block stops it. No aria-live: announcing a number every
 * few seconds would be relentless.
 */

interface Props {
  skin: Skin;
  /** Server-resolved starting state (`initialHeartRate()` in src/lib/heartRate.ts). */
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

  const view = readingView(reading)!;
  const { bpm, text, recent, age, beat } = view;
  const title = recent
    ? `Maan's most recent heart rate, from ${age}: about ${bpm} beats per minute (not live)`
    : `Maan's heart rate, live: ${bpm} beats per minute`;

  if (skin === 'retro') {
    const lcd = `${recent ? '~' : ''}${String(bpm).padStart(3, '0')}`;
    return (
      <p className={`rt-heart${recent ? ' rt-heart--recent' : ''}`} title={title}>
        <span className="rt-heart__icon" style={beat} aria-hidden="true">♥</span>
        {' '}my heart rate:{' '}
        <span className="rt-heart__lcd">{lcd}</span> BPM
        {' '}{recent ? <span className="rt-heart__age">({age})</span> : <span className="rt-heart__live">LIVE</span>}
      </p>
    );
  }

  if (skin === 'mandy') {
    return (
      <p className={`md-heart${recent ? ' md-heart--recent' : ''}`} title={title}>
        <span className="md-heart__icon" style={beat} aria-hidden="true">♥</span>
        <span className="md-heart__label">heart rate</span>
        <span className="md-heart__bpm"><MandyBpm bpm={bpm} recent={recent} /></span>
        <span className="md-heart__unit">bpm</span>
        {recent ? <span className="md-heart__age">· {age}</span> : <span className="md-heart__dot" aria-hidden="true" />}
      </p>
    );
  }

  if (recent) {
    return (
      <p
        className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full border border-base-content/10 bg-base-200/40 px-3 py-1 text-xs text-base-content/60 backdrop-blur"
        title={title}
      >
        <span className="text-error/70" aria-hidden="true">♥</span>
        <span>
          my heart rate: <span className="font-semibold tabular-nums">{text}</span> bpm · {age}
        </span>
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
        my heart rate: <span className="font-semibold tabular-nums text-base-content">{text}</span> bpm
      </span>
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full bg-error opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-error" />
      </span>
    </p>
  );
}

export default HeartRate;
