import { persistTheme } from './theme';
import type { Theme } from './theme';

/**
 * The one place a theme choice from the UI is applied. Browser-only.
 *
 * Swatches pass the point to grow a circular reveal from; the command palette
 * passes nothing and gets the colour fade. A newer choice always wins at once:
 * starting a view transition skips the one in flight, and the palette skips it
 * explicitly, so rapid clicks interrupt instead of queueing.
 */

export interface RevealOrigin {
  x: number;
  y: number;
}

interface ViewTransitionLike {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition(): void;
}

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => ViewTransitionLike;
};

const REVEAL_MS = 500;
const FADE_MS = 400;

// Module state is shared by every island that imports this file (ThemeBar and
// CommandPalette), because the bundler emits it once per page.
let wanted: Theme | undefined;
let reveal: ViewTransitionLike | undefined;
let fadeTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Write the latest choice, not the one a transition was started with. A
 * skipped transition still runs its update callback, possibly after a newer
 * choice was applied directly, and must not put the older theme back.
 */
function commit(): void {
  if (wanted) document.documentElement.setAttribute('data-theme', wanted);
}

function startFade(root: HTMLElement): void {
  clearTimeout(fadeTimer);
  root.setAttribute('data-theme-fade', '');
  fadeTimer = setTimeout(() => root.removeAttribute('data-theme-fade'), FADE_MS);
}

export function switchTheme(theme: Theme, origin?: RevealOrigin): void {
  const root = document.documentElement;
  const previous = wanted;
  wanted = theme;
  // Save right away, outside the browser's snapshot pause, so a navigation
  // that interrupts the animation still keeps the choice.
  persistTheme(theme);

  // Already showing it, or a reveal in flight is already heading there.
  if (reveal ? previous === theme : root.getAttribute('data-theme') === theme) return;

  const doc = document as TransitionDocument;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!origin || reduceMotion || !doc.startViewTransition) {
    reveal?.skipTransition();
    reveal = undefined;
    root.removeAttribute('data-theme-switching');
    if (!reduceMotion) startFade(root);
    commit();
    return;
  }

  const { x, y } = origin;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  root.setAttribute('data-theme-switching', '');
  const transition = doc.startViewTransition(commit);
  reveal = transition;

  transition.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: REVEAL_MS,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    // Rejects when a newer choice skips this reveal; nothing to clean up.
    .catch(() => {});

  // An interrupted reveal settles after its replacement has started, so only
  // the newest one may clear the hook its replacement is still using.
  transition.finished
    .catch(() => {})
    .then(() => {
      if (reveal !== transition) return;
      reveal = undefined;
      root.removeAttribute('data-theme-switching');
    });
}
