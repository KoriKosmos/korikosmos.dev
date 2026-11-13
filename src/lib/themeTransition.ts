import { persistTheme } from './theme';
import type { Theme } from './theme';

export const THEME_CHANGE_EVENT = 'theme:change';

interface Origin { x: number; y: number }
interface ThemeRequest { theme: Theme; origin?: Origin }
type ViewTransitionLike = { ready: Promise<void>; finished: Promise<void> };
type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => ViewTransitionLike;
};

// Both React islands share one coordinator, even if they hydrate or unmount
// independently. No browser state is accessed when this module renders on SSR.
const coordinators = new WeakMap<Document, (request: ThemeRequest) => void>();

function createCoordinator(doc: TransitionDocument) {
  const win = doc.defaultView!;
  let active: ThemeRequest | undefined;
  let queued: ThemeRequest | undefined;
  let fadeTimeout: number | undefined;

  function request(change: ThemeRequest) {
    // Check before the same-theme shortcut: choosing the old theme while its
    // replacement is waiting for a snapshot must still return to that choice.
    if (active) {
      queued = change;
      return;
    }

    const root = doc.documentElement;
    if (root.getAttribute('data-theme') === change.theme) return;

    // Only the request being applied may write storage, outside the snapshot
    // pause. A queued palette action cannot get ahead of the visible reveal.
    persistTheme(change.theme);
    const commit = () => {
      root.setAttribute('data-theme', change.theme);
      root.dispatchEvent(new win.Event(THEME_CHANGE_EVENT));
    };
    const reducedMotion = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    win.clearTimeout(fadeTimeout);
    root.removeAttribute('data-theme-fade');

    if (reducedMotion || !change.origin || !doc.startViewTransition) {
      if (!reducedMotion) {
        root.setAttribute('data-theme-fade', '');
        fadeTimeout = win.setTimeout(() => root.removeAttribute('data-theme-fade'), 400);
      }
      commit();
      return;
    }

    const { x, y } = change.origin;
    const radius = Math.hypot(
      Math.max(x, win.innerWidth - x),
      Math.max(y, win.innerHeight - y),
    );
    active = change;
    root.setAttribute('data-theme-switching', '');
    const finish = () => {
      if (active !== change) return;
      active = undefined;
      root.removeAttribute('data-theme-switching');
      const next = queued;
      queued = undefined;
      if (next) request(next);
    };

    let transition: ViewTransitionLike;
    try {
      transition = doc.startViewTransition(commit);
    } catch {
      // Keep the controls usable if the browser cannot start a transition.
      commit();
      finish();
      return;
    }
    void transition.ready.then(() => {
      if (active !== change) return;
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'both',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    }).catch(() => {
      // A navigation can skip the reveal. Wait for finished, which also waits
      // for the pending DOM update, before applying another theme request.
    });
    void transition.finished.then(finish, finish);
  }

  return request;
}

/** Swatches supply a reveal origin; the command palette keeps its colour fade. */
export function requestTheme(theme: Theme, origin?: Origin): void {
  let request = coordinators.get(document);
  if (!request) {
    request = createCoordinator(document);
    coordinators.set(document, request);
  }
  request({ theme, origin });
}
