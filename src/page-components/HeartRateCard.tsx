import type { HeartStatus } from '../lib/pulsoidClient';
import { setHeartFloat, useHeartFloat, useHeartRate } from '../lib/heartRateStore';
import { EcgTrace, PulsoidWidgetFrame, heartZone, type Skin } from './heartRateParts';

/**
 * The heart monitor proper: ECG trace, BPM and a mood label. Rendered by the
 * /about box below and by the floating window (HeartRateFloat.tsx). Stays
 * visible while the strap is off (flatline + a note), unlike the footer pill,
 * because a box that vanishes from a page reads as broken.
 */
export function HeartMonitorBody({ skin, reading }: { skin: Skin; reading: HeartStatus }) {
  if (reading.mode === 'widget') {
    const wrap = skin === 'retro' ? 'rt-heartmon__widget' : skin === 'mandy' ? 'md-heartmon__widget' : 'flex justify-center';
    return <div className={wrap}><PulsoidWidgetFrame src={reading.src} /></div>;
  }

  const bpm = reading.mode === 'live' ? reading.bpm : null;
  const label = bpm ? `ECG trace beating at ${bpm} beats per minute` : 'A flat ECG trace: the heart monitor is off';
  const zone = bpm ? heartZone(bpm) : 'monitor’s off — probably asleep, or it’s charging';
  const beat = bpm ? { animationDuration: `${(60 / bpm).toFixed(3)}s` } : undefined;

  if (skin === 'retro') {
    return (
      <div className="rt-heartmon">
        <div className="rt-heartmon__screen">
          <EcgTrace bpm={bpm} label={label} className="rt-heartmon__trace" />
        </div>
        <p className="rt-heartmon__readout">
          <span className="rt-heart__icon" style={beat} aria-hidden="true">♥</span>{' '}
          <span className="rt-heart__lcd">{bpm ? String(bpm).padStart(3, '0') : '---'}</span> BPM
          {bpm ? <> <span className="rt-heart__live">LIVE</span></> : null}
        </p>
        <p className="rt-note" style={{ margin: 0 }}>status: {zone}</p>
      </div>
    );
  }

  if (skin === 'mandy') {
    return (
      <div className="md-heartmon">
        <div className="md-heartmon__screen">
          <EcgTrace bpm={bpm} label={label} className="md-heartmon__trace" />
        </div>
        <p className="md-heartmon__readout">
          <span className="md-heart__icon" style={beat} aria-hidden="true">♥</span>
          <span className="md-heartmon__bpm">{bpm ?? '--'}</span>
          <span className="md-heartmon__unit">bpm</span>
        </p>
        <p className="md-heartmon__zone">{zone}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-lg bg-base-300/70 p-2 text-error">
        <EcgTrace bpm={bpm} label={label} />
      </div>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="kk-heartbeat text-2xl text-error" style={beat} aria-hidden="true">♥</span>
        <span className="text-4xl font-extrabold tabular-nums">{bpm ?? '--'}</span>
        <span className="text-sm text-base-content/60">bpm</span>
      </p>
      <p className="text-sm text-base-content/70">{zone}</p>
    </div>
  );
}

interface Props {
  skin: Skin;
  initial: HeartStatus;
}

/** "Its own box" on /about, with a button that pops the floating window. */
export function HeartRateCard({ skin, initial }: Props) {
  const reading = useHeartRate(initial);
  const { open } = useHeartFloat();
  const popLabel = open ? 'Close the floating monitor' : 'Pop out as a floating window';
  const toggle = () => setHeartFloat({ open: !open });

  if (skin === 'retro') {
    return (
      <div className="rt-panel">
        <div className="rt-panel__title">MY_HEART.EXE</div>
        <div className="rt-panel__body">
          <p style={{ marginTop: 0 }}>
            This is my actual heart, beating right now. A chest strap sends it to my phone, my phone sends it to
            Pulsoid, and Pulsoid sends it to you. The future is amazing.
          </p>
          <HeartMonitorBody skin="retro" reading={reading} />
          <p style={{ margin: '10px 0 0' }}>
            <button type="button" className="rt-btn" onClick={toggle} aria-pressed={open}>
              {open ? '✕ Close floating window' : '⧉ Pop out!!'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (skin === 'mandy') {
    return (
      <section className="md-section" aria-labelledby="md-about-heart">
        <div className="md-section__head">
          <h2 className="md-section__title" id="md-about-heart">Vitals</h2>
          <span className="md-section__tag">live from the strap</span>
        </div>
        <div className="md-section__body">
          <p>
            My actual heart rate, right now &mdash; a chest strap, my phone, and{' '}
            <a href="https://pulsoid.net" target="_blank" rel="noopener noreferrer">Pulsoid</a> in between.
          </p>
        </div>
        <HeartMonitorBody skin="mandy" reading={reading} />
        <p style={{ marginTop: '1.25rem' }}>
          <button type="button" className="md-btn md-btn--ghost" onClick={toggle} aria-pressed={open}>
            {open ? 'Close the floating monitor' : 'Pop it out'}
          </button>
        </p>
      </section>
    );
  }

  return (
    <section className="bg-base-200 rounded-xl p-6 shadow-lg my-8" aria-labelledby="about-heart">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="about-heart" className="text-2xl font-bold">Live heart rate</h2>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={open}
          title={popLabel}
          className="rounded bg-neutral px-3 py-1.5 text-sm text-neutral-content transition-transform hover:scale-105"
        >
          {open ? 'Close floating window' : 'Pop out ↗'}
        </button>
      </div>
      <p className="mb-4 mt-1 text-sm text-base-content/70">
        My actual heart, beating right now: a chest strap, my phone, and{' '}
        <a className="underline" href="https://pulsoid.net" target="_blank" rel="noopener noreferrer">Pulsoid</a>.
      </p>
      <HeartMonitorBody skin="modern" reading={reading} />
    </section>
  );
}

export default HeartRateCard;
