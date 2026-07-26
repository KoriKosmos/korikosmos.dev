import { useEffect, useRef, useState } from 'react';
import { DEFAULT_RETRO_THEME, RETRO_THEMES, type RetroTheme } from '../lib/skin';

/**
 * The retro skin's floating widgets: theme swatches, a sparkle cursor trail,
 * and a Web Audio chiptune loop standing in for the background MIDI.
 *
 * The tune is synthesised rather than shipped as a file — same reasoning as the
 * generated graphics. It defaults to OFF and only ever starts from a click:
 * browsers block AudioContext without a user gesture, and a page that starts
 * playing music at you is the one part of 2004 worth leaving behind.
 *
 * The retro shell does full page loads (no ClientRouter), so this remounts on
 * every navigation and needs no persistence handling — but that also means the
 * tune stops when you navigate, since a fresh page can't resume audio without
 * a new gesture.
 */

const THEME_KEY = 'retro-theme';

const SWATCHES: Record<RetroTheme, { label: string; css: string }> = {
  kawaii: { label: 'Kawaii', css: 'linear-gradient(135deg,#ff8ec4,#ffd6ea)' },
  geocities: { label: 'GeoCities', css: 'linear-gradient(135deg,#000018,#ffff00)' },
  cyber: { label: 'Cyberspace', css: 'linear-gradient(135deg,#020d06,#00ff66)' },
  y2k: { label: 'Y2K chrome', css: 'linear-gradient(135deg,#c8d2e4,#000080)' },
};

/* --- chiptune -------------------------------------------------------------
   A 16-step square-wave loop in A minor, plus a triangle bass. Deliberately
   simple: it should read as a 1998 .mid, not as music. */
const LEAD: (number | null)[] = [
  440, 523.25, 659.25, 523.25, 587.33, 440, 349.23, 440,
  392, 493.88, 587.33, 493.88, 523.25, 392, 329.63, null,
];
const BASS: number[] = [110, 110, 130.81, 130.81, 98, 98, 82.41, 82.41];
const STEP_SECONDS = 0.16;

function useChiptune() {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const nextTimeRef = useRef(0);

  const stop = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    ctxRef.current?.close();
    ctxRef.current = null;
    gainRef.current = null;
    stepRef.current = 0;
  };

  const start = () => {
    const AudioCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return false;

    const ctx = new AudioCtor();
    const master = ctx.createGain();
    master.gain.value = 0.06; // quiet enough not to be an ambush
    master.connect(ctx.destination);
    ctxRef.current = ctx;
    gainRef.current = master;
    nextTimeRef.current = ctx.currentTime + 0.08;

    const voice = (freq: number, at: number, type: OscillatorType, length: number, level: number) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.0001, at);
      env.gain.exponentialRampToValueAtTime(level, at + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, at + length);
      osc.connect(env).connect(master);
      osc.start(at);
      osc.stop(at + length + 0.02);
    };

    // Look-ahead scheduler: queue anything due in the next 200ms.
    const schedule = () => {
      if (!ctxRef.current) return;
      while (nextTimeRef.current < ctxRef.current.currentTime + 0.2) {
        const step = stepRef.current;
        const lead = LEAD[step % LEAD.length];
        if (lead) voice(lead, nextTimeRef.current, 'square', STEP_SECONDS * 0.85, 0.5);
        if (step % 2 === 0) {
          voice(BASS[(step / 2) % BASS.length], nextTimeRef.current, 'triangle', STEP_SECONDS * 1.6, 0.35);
        }
        stepRef.current = step + 1;
        nextTimeRef.current += STEP_SECONDS;
      }
    };

    schedule();
    timerRef.current = window.setInterval(schedule, 60);
    return true;
  };

  useEffect(() => stop, []);
  return { start, stop };
}

/* --- sparkle trail -------------------------------------------------------- */
function useSparkleTrail(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let last = 0;
    const onMove = (event: MouseEvent) => {
      const now = performance.now();
      if (now - last < 70) return; // one sparkle per ~70ms, not per pixel
      last = now;

      const sparkle = document.createElement('img');
      sparkle.src = '/retro/gfx/sparkle.svg';
      sparkle.alt = '';
      sparkle.setAttribute('aria-hidden', 'true');
      sparkle.className = 'rt-sparkle';
      sparkle.style.left = `${event.clientX - 7 + (Math.random() * 10 - 5)}px`;
      sparkle.style.top = `${event.clientY - 7}px`;
      document.body.appendChild(sparkle);
      window.setTimeout(() => sparkle.remove(), 750);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.querySelectorAll('.rt-sparkle').forEach(node => node.remove());
    };
  }, [enabled]);
}

export function RetroChrome() {
  const [theme, setTheme] = useState<RetroTheme>(DEFAULT_RETRO_THEME);
  const [sparkles, setSparkles] = useState(false);
  const [playing, setPlaying] = useState(false);
  const chiptune = useChiptune();

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as RetroTheme | null;
    if (stored && RETRO_THEMES.includes(stored)) setTheme(stored);
    setSparkles(localStorage.getItem('retro-sparkles') !== 'false');
  }, []);

  const pickTheme = (next: RetroTheme) => {
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.setAttribute('data-retro-theme', next);
  };

  const toggleSparkles = () => {
    const next = !sparkles;
    setSparkles(next);
    localStorage.setItem('retro-sparkles', String(next));
  };

  const toggleMusic = () => {
    if (playing) {
      chiptune.stop();
      setPlaying(false);
    } else if (chiptune.start()) {
      setPlaying(true);
    }
  };

  useSparkleTrail(sparkles);

  return (
    <div className="rt-dock rt-dock--tr">
      <div className="rt-panel" style={{ marginBottom: 0, width: '150px' }}>
        <div className="rt-panel__title rt-panel__title--plain">Control Panel</div>
        <div className="rt-panel__body" style={{ padding: '6px 8px' }}>
          <div className="rt-swatches" role="group" aria-label="Retro colour scheme">
            {RETRO_THEMES.map(name => (
              <button
                key={name}
                type="button"
                className="rt-swatch"
                style={{ background: SWATCHES[name].css }}
                aria-label={`${SWATCHES[name].label} colour scheme`}
                aria-pressed={theme === name}
                onClick={() => pickTheme(name)}
              />
            ))}
          </div>
          <button
            type="button"
            className="rt-btn"
            style={{ display: 'block', width: '100%', marginTop: '6px', padding: '2px 4px' }}
            onClick={toggleMusic}
            aria-pressed={playing}
          >
            {playing ? '⏹ Stop MIDI' : '♪ Play MIDI'}
          </button>
          <button
            type="button"
            className="rt-btn"
            style={{ display: 'block', width: '100%', marginTop: '4px', padding: '2px 4px' }}
            onClick={toggleSparkles}
            aria-pressed={sparkles}
          >
            {sparkles ? '✨ Sparkles ON' : '✨ Sparkles OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RetroChrome;
