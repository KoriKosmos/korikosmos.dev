import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { HeartStatus } from '../lib/heartRateTypes';
import { setHeartFloat, useHeartFloat, useHeartRate } from '../lib/heartRateStore';
import { HeartMonitorBody } from './HeartRateCard';
import type { Skin } from './heartRateParts';

/**
 * A toggleable, draggable floating heart monitor, on every page of every skin.
 * A small ♥ button (stacked above the cat toggle, bottom right) opens it; the
 * /about box's "pop out" button drives the same state.
 *
 * Persistence: open state + position live in localStorage via
 * heartRateStore, so the window comes back after the full-reload navigations
 * of the retro and Mandy shells. In the modern shell the island is also
 * `transition:persist`ed, so the window is never torn down between pages.
 */

const MARGIN = 8;

interface Props {
  skin: Skin;
  initial: HeartStatus;
}

export function HeartRateFloat({ skin, initial }: Props) {
  const reading = useHeartRate(initial);
  const float = useHeartFloat();
  const windowRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  // Position while dragging; committed to the store (and storage) on release.
  const [live, setLive] = useState<{ x: number; y: number } | null>(null);

  const clamp = (x: number, y: number) => {
    const el = windowRef.current;
    const w = el?.offsetWidth ?? 280;
    const h = el?.offsetHeight ?? 200;
    return {
      x: Math.min(Math.max(MARGIN, x), Math.max(MARGIN, window.innerWidth - w - MARGIN)),
      y: Math.min(Math.max(MARGIN, y), Math.max(MARGIN, window.innerHeight - h - MARGIN)),
    };
  };

  // A position saved on a bigger screen (or before a resize) must stay reachable.
  useEffect(() => {
    if (!float.open) return;
    const refit = () => {
      if (float.x === null || float.y === null) return;
      const next = clamp(float.x, float.y);
      if (next.x !== float.x || next.y !== float.y) setHeartFloat(next);
    };
    refit();
    window.addEventListener('resize', refit);
    return () => window.removeEventListener('resize', refit);
  }, [float.open, float.x, float.y]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
    const rect = windowRef.current!.getBoundingClientRect();
    drag.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
    setLive({ x: rect.left, y: rect.top });
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setLive(clamp(event.clientX - drag.current.dx, event.clientY - drag.current.dy));
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    if (live) setHeartFloat(live);
    setLive(null);
  };

  const toggle = () => setHeartFloat({ open: !float.open });
  const close = () => setHeartFloat({ open: false });

  const at = live ?? (float.x !== null && float.y !== null ? { x: float.x, y: float.y } : null);
  const position = at ? { left: at.x, top: at.y } : { right: 16, bottom: 112 };
  const toggleLabel = float.open ? 'Hide the floating heart monitor' : 'Show a floating heart monitor';
  const dragHandlers = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
  const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
  const title = 'Heart monitor';

  const toggleButton = skin === 'retro' ? (
    <button type="button" className="rt-btn rt-heartdock" onClick={toggle} aria-pressed={float.open} aria-label={toggleLabel} title={toggleLabel}>
      ♥ {float.open ? 'Hide' : 'Heart'}
    </button>
  ) : skin === 'mandy' ? (
    <button type="button" className="md-skins__btn md-heartdock" onClick={toggle} aria-pressed={float.open} aria-label={toggleLabel} title={toggleLabel}>
      <span aria-hidden="true">♥</span> {float.open ? 'Hide' : 'Heart'}
    </button>
  ) : (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={float.open}
      aria-label={toggleLabel}
      title={toggleLabel}
      className="fixed bottom-16 right-4 z-50 flex items-center gap-1.5 rounded bg-base-200 px-3 py-2 text-sm text-base-content transition-transform duration-200 hover:scale-105"
    >
      <span className="text-error" aria-hidden="true">♥</span> {float.open ? 'Hide' : 'Heart'}
    </button>
  );

  if (!float.open) return toggleButton;

  const body = <HeartMonitorBody skin={skin} reading={reading} />;

  if (skin === 'retro') {
    return (
      <>
        {toggleButton}
        <div ref={windowRef} className="rt-heartwin" style={position} role="region" aria-label={title} onKeyDown={onKeyDown}>
          <div className="rt-panel__title rt-heartwin__bar" {...dragHandlers}>
            <span>♥ HEART_MONITOR.EXE</span>
            <button type="button" className="rt-heartwin__close" onClick={close} aria-label="Close the heart monitor">✕</button>
          </div>
          <div className="rt-panel__body">{body}</div>
        </div>
      </>
    );
  }

  if (skin === 'mandy') {
    return (
      <>
        {toggleButton}
        <div ref={windowRef} className="md-heartwin" style={position} role="region" aria-label={title} onKeyDown={onKeyDown}>
          <div className="md-heartwin__bar" {...dragHandlers}>
            <span>♥ vitals</span>
            <button type="button" className="md-heartwin__close" onClick={close} aria-label="Close the heart monitor">✕</button>
          </div>
          <div className="md-heartwin__body">{body}</div>
        </div>
      </>
    );
  }

  return (
    <>
      {toggleButton}
      <div
        ref={windowRef}
        className="fixed z-[60] w-72 max-w-[calc(100vw-16px)] overflow-hidden rounded-xl border border-base-content/15 bg-base-200/90 text-base-content shadow-2xl backdrop-blur"
        style={position}
        role="region"
        aria-label={title}
        onKeyDown={onKeyDown}
      >
        <div
          className="flex cursor-move select-none items-center justify-between border-b border-base-content/10 px-3 py-2 text-sm font-semibold"
          style={{ touchAction: 'none' }}
          {...dragHandlers}
        >
          <span><span className="text-error" aria-hidden="true">♥</span> Heart monitor</span>
          <button
            type="button"
            onClick={close}
            aria-label="Close the heart monitor"
            className="rounded px-1.5 text-base-content/60 hover:bg-base-300 hover:text-base-content"
          >
            ✕
          </button>
        </div>
        <div className="p-3">{body}</div>
      </div>
    </>
  );
}

export default HeartRateFloat;
