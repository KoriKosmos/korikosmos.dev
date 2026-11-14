import { useEffect, useRef } from 'react';
import type { HeartStatus } from '../lib/heartRateTypes';

/** Pieces shared by the heart-rate footer, /about box, and floating window. */

export type Skin = 'modern' | 'retro' | 'mandy';

/** A light-hearted label for the number. */
export function heartZone(bpm: number): string {
  if (bpm < 60) return 'resting, very zen';
  if (bpm < 85) return 'chilling';
  if (bpm < 105) return 'up and about';
  if (bpm < 130) return 'something exciting is happening';
  return 'boss fight';
}

/** One heartbeat (P, QRS, T), phase 0–1 → amplitude, roughly −0.3…1. */
function ecg(phase: number): number {
  const bump = (centre: number, width: number, height: number) =>
    height * Math.exp(-(((phase - centre) / width) ** 2));
  return bump(0.16, 0.035, 0.12)   // P
    - bump(0.285, 0.008, 0.12)     // Q
    + bump(0.305, 0.011, 1)        // R
    - bump(0.33, 0.01, 0.28)       // S
    + bump(0.52, 0.06, 0.22);      // T
}

const SWEEP_SECONDS = 3;

/**
 * A bedside-monitor ECG trace that sweeps at the live BPM: the line is drawn
 * left to right and erases a gap just ahead of itself. `bpm = null` draws a
 * flatline. Colour is the canvas's CSS `color`, so each skin sets it with a
 * class. Under prefers-reduced-motion, or with `still` (a recent reading that
 * isn't live), it draws one static strip instead.
 */
export function EcgTrace({ bpm, className, height = 56, label, still: frozen = false }: {
  bpm: number | null;
  className?: string;
  height?: number;
  label: string;
  still?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const still = frozen || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let samples = new Float32Array(0);
    let filled = new Uint8Array(0);
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = Math.max(1, Math.round(canvas.clientWidth));
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      samples = new Float32Array(width);
      filled = new Uint8Array(width);
    };
    resize();
    const observer = new ResizeObserver(() => { resize(); if (still) drawStill(); });
    observer.observe(canvas);

    const yOf = (amp: number) => height * 0.62 - amp * height * 0.5;
    const stroke = (from: number, to: number) => {
      ctx.beginPath();
      let pen = false;
      for (let x = from; x < to; x++) {
        if (!filled[x]) { pen = false; continue; }
        const y = yOf(samples[x]);
        if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        pen = true;
      }
      ctx.stroke();
    };
    const style = () => {
      ctx.strokeStyle = getComputedStyle(canvas).color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
    };

    const drawStill = () => {
      const beat = bpmRef.current;
      const period = beat ? 60 / beat : 1;
      for (let x = 0; x < width; x++) {
        const t = (x / width) * SWEEP_SECONDS;
        samples[x] = beat ? ecg((t % period) / period) : 0;
        filled[x] = 1;
      }
      ctx.clearRect(0, 0, width, height);
      style();
      stroke(0, width);
    };

    if (still) {
      drawStill();
      return () => observer.disconnect();
    }

    let raf = 0;
    let last = performance.now();
    let phase = 0;   // position within the current beat
    let cursor = 0;  // column the pen is at
    let carry = 0;   // fractional columns not yet drawn
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (cursor >= width) cursor = 0; // the canvas shrank
      // Advance one whole column at a time so no column is ever skipped (a
      // skipped column would lift the pen and break the line into dots).
      const columnSeconds = SWEEP_SECONDS / width;
      carry += dt / columnSeconds;
      while (carry >= 1) {
        carry -= 1;
        const beat = bpmRef.current;
        phase = beat ? (phase + columnSeconds / (60 / beat)) % 1 : 0;
        cursor = (cursor + 1) % width;
        samples[cursor] = beat ? ecg(phase) : 0;
        filled[cursor] = 1;
        // The gap ahead of the pen, like a real monitor's erase bar.
        for (let g = 1; g <= 12; g++) filled[(cursor + g) % width] = 0;
      }
      ctx.clearRect(0, 0, width, height);
      style();
      stroke(0, width);
      // A bright dot at the pen.
      ctx.beginPath();
      ctx.arc(cursor, yOf(samples[cursor]), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [height, frozen]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', height }}
      role="img"
      aria-label={label}
    />
  );
}

/** What a reading shows: the number, "~72" when it isn't live, and how old it is. */
export function readingView(reading: HeartStatus) {
  if (reading.mode !== 'live' && reading.mode !== 'recent') return null;
  const recent = reading.mode === 'recent';
  return {
    bpm: reading.bpm,
    recent,
    text: reading.bpm_text ?? `${recent ? '~' : ''}${reading.bpm}`,
    /** "5 min ago", only for a recent reading. */
    age: recent ? reading.bpm_age ?? 'a few minutes ago' : null,
    /** Live readings beat at their BPM; a recent one sits still. */
    beat: recent ? undefined : { animationDuration: `${(60 / reading.bpm).toFixed(3)}s` },
  };
}

/**
 * Mandy's pixel display face draws "~" as a short dash, so "~68" reads as
 * "-68". There the tilde is set in the body face, with "about" for screen readers.
 */
export function MandyBpm({ bpm, recent }: { bpm: number | string; recent: boolean }) {
  if (!recent) return <>{bpm}</>;
  return <><span className="md-approx" aria-hidden="true">~</span><span className="md-sr-only">about </span>{bpm}</>;
}

/**
 * Pulsoid's free widget (the fallback). It draws at roughly 400×200 and is
 * shown at half scale, as the widget's own embed guide does. Cross-origin, so
 * it can't be recoloured: style it on pulsoid.net with a transparent
 * background so it sits on any skin. It is blank while the monitor is off.
 */
export function PulsoidWidgetFrame({ src }: { src: string }) {
  return (
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
}
