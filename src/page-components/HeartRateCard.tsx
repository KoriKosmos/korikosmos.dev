import { useEffect, useState } from 'react';
import type { HeartStatus } from '../lib/heartRateTypes';
import { sparklinePoints, type VitalsTrend } from '../lib/vitalsTrend';
import { setHeartFloat, useHeartFloat, useHeartRate } from '../lib/heartRateStore';
import { EcgTrace, MandyBpm, PulsoidWidgetFrame, heartZone, readingView, todayGroups, type Skin } from './heartRateParts';

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

/**
 * Today's stats, grouped heart / day / night; only rows with data render.
 * `compact` is the floating window's version: one column, tighter, and plain
 * text titles instead of headings, since the window sits on every page and
 * shouldn't add to each page's heading outline.
 */
export function HeartToday({ skin, reading, compact = false }: { skin: Skin; reading: HeartStatus; compact?: boolean }) {
  const groups = todayGroups(reading.mode === 'widget' ? undefined : reading.stats);
  if (!groups.length) return null;

  if (skin === 'retro') {
    const icons = { heart: '♥', day: '☀', night: '☾' };
    return (
      <table className={`rt-table rt-today${compact ? ' rt-today--compact' : ''}`}>
        <caption>TODAY&apos;S STATS</caption>
        {groups.map(({ group, title, rows }) => (
          <tbody key={group}>
            {rows.map((row, index) => (
              <tr key={row.key}>
                {index === 0 ? (
                  <th scope="rowgroup" rowSpan={rows.length}>
                    <span aria-hidden="true">{icons[group]}</span> {title.toUpperCase()}
                  </th>
                ) : null}
                <td>{row.label}</td>
                <td>
                  {row.key === 'steps' && /^\d+$/.test(row.value)
                    ? <span className="rt-heart__lcd">{row.value.padStart(6, '0')}</span>
                    : row.value}
                  {row.unit ? ` ${row.unit}` : null}
                  {row.src ? <> <span className="rt-today__src">({row.src})</span></> : null}
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    );
  }

  if (skin === 'mandy') {
    return (
      <>
        {compact ? <p className="md-today__heading">today</p> : <h3 className="md-subhead">today</h3>}
        <div className={`md-today${compact ? ' md-today--compact' : ''}`}>
          {groups.map(({ group, title, rows }) => (
            <div className="md-today__group" key={group}>
              {compact ? <p className="md-today__title">{title}</p> : <h4 className="md-today__title">{title}</h4>}
              <dl className="md-today__list">
                {rows.map(row => (
                  <div className="md-today__row" key={row.key}>
                    <dt>{row.label}</dt>
                    <dd>
                      {row.value}
                      {row.unit ? <span className="md-today__unit">{row.unit}</span> : null}
                      {row.src ? <span className="md-today__src">{row.src}</span> : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {compact
        ? <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-base-content/60">Today</p>
        : <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-base-content/60">Today</h3>}
      <div className={compact ? 'grid gap-2' : 'grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]'}>
        {groups.map(({ group, title, rows }) => (
          <div className={compact ? 'rounded-lg bg-base-300/50 px-3 py-2' : 'rounded-lg bg-base-300/50 p-3'} key={group}>
            {compact
              ? <p className="mb-1 text-sm font-semibold">{title}</p>
              : <h4 className="mb-2 text-sm font-semibold">{title}</h4>}
            <dl className="space-y-1 text-sm">
              {rows.map(row => (
                <div className="flex items-baseline justify-between gap-2" key={row.key}>
                  <dt className="text-base-content/70">{row.label}</dt>
                  <dd className="flex items-baseline gap-1 text-right font-semibold tabular-nums">
                    {row.value}
                    {row.unit ? <span className="text-xs font-normal text-base-content/60">{row.unit}</span> : null}
                    {row.src ? <span className="badge badge-ghost badge-xs font-normal">{row.src}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}

const SPARK_W = 120;
const SPARK_H = 28;
const fmt = (n: number) => n.toLocaleString('en-GB');
const weekday = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });

/**
 * "This week": a sparkline per stat over the last seven days, from the site's
 * own daily log (/api/vitals). Fetched once when the card hydrates (it is
 * client:visible), and absent until at least two days are logged.
 */
export function HeartWeek({ skin }: { skin: Skin }) {
  const [trend, setTrend] = useState<VitalsTrend | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/vitals', { signal: controller.signal })
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data?.series) setTrend(data); })
      .catch(() => { /* No trend is fine. */ });
    return () => controller.abort();
  }, []);
  if (!trend?.series.length) return null;

  const range = `${weekday(trend.days[0])} to ${weekday(trend.days[trend.days.length - 1])}`;
  const spark = (values: (number | null)[], label: string, className?: string) => (
    <svg viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} width={SPARK_W} height={SPARK_H} className={className} role="img" aria-label={label}>
      <polyline points={sparklinePoints(values, SPARK_W, SPARK_H)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
  const describe = (s: VitalsTrend['series'][number]) =>
    `${s.label} over the last seven days: ${s.values.map(v => (v === null ? 'no data' : fmt(v))).join(', ')}`;

  if (skin === 'retro') {
    return (
      <table className="rt-table rt-week">
        <caption>THIS WEEK ({range.toUpperCase()})</caption>
        <tbody>
          {trend.series.map(s => (
            <tr key={s.key}>
              <th scope="row">{s.label}</th>
              <td className="rt-week__spark">{spark(s.values, describe(s))}</td>
              <td>{fmt(s.latest)}{s.unit ? ` ${s.unit}` : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (skin === 'mandy') {
    return (
      <>
        <h3 className="md-subhead">this week</h3>
        <dl className="md-week">
          {trend.series.map(s => (
            <div className="md-week__row" key={s.key}>
              <dt>{s.label}</dt>
              <dd>
                {spark(s.values, describe(s), 'md-week__spark')}
                <span className="md-week__latest">{fmt(s.latest)}{s.unit ? <span className="md-today__unit">{s.unit}</span> : null}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="md-note">{range}, latest on the right.</p>
      </>
    );
  }

  return (
    <>
      <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-base-content/60">This week</h3>
      <dl className="grid gap-2 sm:grid-cols-2">
        {trend.series.map(s => (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-base-300/50 px-3 py-2" key={s.key}>
            <dt className="text-sm text-base-content/70">{s.label}</dt>
            <dd className="flex items-center gap-2 text-sm font-semibold tabular-nums">
              {spark(s.values, describe(s), 'text-primary')}
              <span>{fmt(s.latest)}{s.unit ? <span className="ml-1 text-xs font-normal text-base-content/60">{s.unit}</span> : null}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-base-content/60">{range}, latest on the right.</p>
    </>
  );
}

interface Props {
  skin: Skin;
  initial: HeartStatus;
}

/** "Its own box" on /about: the monitor, today's stats, and a pop-out button. */
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
          <HeartToday skin="retro" reading={reading} />
          <HeartWeek skin="retro" />
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
            My heart rate right now, plus the rest of today &mdash; my watch, ring and phone, merged by{' '}
            {link()}, a little server I wrote.
          </p>
        </div>
        <HeartMonitorBody skin="mandy" reading={reading} />
        <HeartToday skin="mandy" reading={reading} />
        <HeartWeek skin="mandy" />
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
        <h2 id="about-heart" className="text-2xl font-bold">Heart rate &amp; today</h2>
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
        My heart rate right now, and how today&apos;s going: my watch, ring and phone, merged by{' '}
        {link('underline')}, a little server I wrote.
      </p>
      <HeartMonitorBody skin="modern" reading={reading} />
      <HeartToday skin="modern" reading={reading} />
      <HeartWeek skin="modern" />
    </section>
  );
}

export default HeartRateCard;
