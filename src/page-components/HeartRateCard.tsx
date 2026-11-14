import type { HeartStatus } from '../lib/heartRateTypes';
import { setHeartFloat, useHeartFloat, useHeartRate } from '../lib/heartRateStore';
import { EcgTrace, MandyBpm, PulsoidWidgetFrame, heartZone, readingView, type Skin } from './heartRateParts';

const HEALTH_DISPLAY = 'https://github.com/KoriKosmos/health-display';
const OFF_NOTE = 'no reading right now: my watch is probably charging';

/**
 * The heart monitor proper: ECG trace, BPM and a mood label. Rendered by the
 * /about box below and by the floating window (HeartRateFloat.tsx). Stays
 * visible with no reading (flatline + a note), unlike the footer pill, because
 * a box that vanishes from a page reads as broken. A recent (not live) reading
 * gets a still, dimmed strip and its age instead of a sweeping trace.
 */
export function HeartMonitorBody({ skin, reading }: { skin: Skin; reading: HeartStatus }) {
  if (reading.mode === 'widget') {
    const wrap = skin === 'retro' ? 'rt-heartmon__widget' : skin === 'mandy' ? 'md-heartmon__widget' : 'flex justify-center';
    return <div className={wrap}><PulsoidWidgetFrame src={reading.src} /></div>;
  }

  const view = readingView(reading);
  const bpm = view?.bpm ?? null;
  const recent = view?.recent ?? false;
  const label = !view
    ? 'A flat ECG trace: no heart rate reading right now'
    : recent
      ? `A still ECG strip at ${view.bpm} beats per minute, last measured ${view.age}`
      : `ECG trace beating at ${view.bpm} beats per minute`;
  const zone = !view ? OFF_NOTE : recent ? `last reading ${view.age}, not live` : heartZone(view.bpm);
  const beat = view?.beat;

  if (skin === 'retro') {
    const lcd = view ? `${recent ? '~' : ''}${String(view.bpm).padStart(3, '0')}` : '---';
    return (
      <div className="rt-heartmon">
        <div className={`rt-heartmon__screen${recent ? ' rt-heartmon__screen--recent' : ''}`}>
          <EcgTrace bpm={bpm} label={label} still={recent} className="rt-heartmon__trace" />
        </div>
        <p className={`rt-heartmon__readout${recent ? ' rt-heart--recent' : ''}`}>
          <span className="rt-heart__icon" style={beat} aria-hidden="true">♥</span>{' '}
          <span className="rt-heart__lcd">{lcd}</span> BPM
          {view && !recent ? <> <span className="rt-heart__live">LIVE</span></> : null}
        </p>
        <p className="rt-note" style={{ margin: 0 }}>status: {zone}</p>
      </div>
    );
  }

  if (skin === 'mandy') {
    return (
      <div className={`md-heartmon${recent ? ' md-heartmon--recent' : ''}`}>
        <div className="md-heartmon__screen">
          <EcgTrace bpm={bpm} label={label} still={recent} className="md-heartmon__trace" />
        </div>
        <p className="md-heartmon__readout">
          <span className="md-heart__icon" style={beat} aria-hidden="true">♥</span>
          <span className="md-heartmon__bpm">{view ? <MandyBpm bpm={view.bpm} recent={recent} /> : '--'}</span>
          <span className="md-heartmon__unit">bpm</span>
        </p>
        <p className="md-heartmon__zone">{zone}</p>
      </div>
    );
  }

  return (
    <div>
      <div className={`rounded-lg bg-base-300/70 p-2 text-error${recent ? ' opacity-50' : ''}`}>
        <EcgTrace bpm={bpm} label={label} still={recent} />
      </div>
      <p className="mt-3 flex items-baseline gap-2">
        <span className={recent ? 'text-2xl text-error/60' : 'kk-heartbeat text-2xl text-error'} style={beat} aria-hidden="true">♥</span>
        <span className={`text-4xl font-extrabold tabular-nums${recent ? ' text-base-content/70' : ''}`}>{view?.text ?? '--'}</span>
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
  const link = (className?: string) => (
    <a className={className} href={HEALTH_DISPLAY} target="_blank" rel="noopener noreferrer">Health Display</a>
  );

  if (skin === 'retro') {
    return (
      <div className="rt-panel">
        <div className="rt-panel__title">MY_HEART.EXE</div>
        <div className="rt-panel__body">
          <p style={{ marginTop: 0 }}>
            This is my actual heart, beating right now. My watch, my ring and my phone all report to a little
            server I wrote ({link()}), and it reports to you. The future is amazing.
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
          <span className="md-section__tag">live from my wrist</span>
        </div>
        <div className="md-section__body">
          <p>
            My heart rate right now &mdash; my watch, ring and phone, merged by{' '}
            {link()}, a little server I wrote.
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
        My heart rate right now: my watch, ring and phone, merged by{' '}
        {link('underline')}, a little server I wrote.
      </p>
      <HeartMonitorBody skin="modern" reading={reading} />
    </section>
  );
}

export default HeartRateCard;
