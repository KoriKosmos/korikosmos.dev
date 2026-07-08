import { useEffect, useRef } from "react";

// Slim nprogress-style bar under the top edge during ClientRouter navigations,
// for pages whose SSR data fetching takes a moment (Tunes hits the Last.fm API).
// Driven by Astro's navigation lifecycle: astro:before-preparation starts it,
// astro:page-load completes it. A 150ms grace period keeps fast navigations
// from flashing the bar; a failsafe reset covers aborted navigations. Only
// client-side navigations show it — on full page loads the browser's own
// indicator applies.

const SHOW_DELAY_MS = 150;
const FAILSAFE_MS = 10000;

export function NavigationProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let showTimer = 0;
    let hideTimer = 0;
    let failsafeTimer = 0;

    const clearTimers = () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(failsafeTimer);
    };

    const start = () => {
      clearTimers();
      showTimer = window.setTimeout(() => {
        bar.style.transition = "none";
        bar.style.opacity = "1";
        bar.style.width = "0%";
        void bar.offsetWidth; // flush so the trickle transition starts from 0
        bar.style.transition = "width 4s cubic-bezier(0.1, 0.7, 0.1, 1)";
        bar.style.width = "85%";
        failsafeTimer = window.setTimeout(finish, FAILSAFE_MS);
      }, SHOW_DELAY_MS);
    };

    const finish = () => {
      clearTimers();
      if (bar.style.opacity !== "1") return; // never became visible
      bar.style.transition = "width 150ms ease-out";
      bar.style.width = "100%";
      hideTimer = window.setTimeout(() => {
        bar.style.transition = "opacity 300ms ease-out";
        bar.style.opacity = "0";
        hideTimer = window.setTimeout(() => {
          bar.style.width = "0%";
        }, 300);
      }, 150);
    };

    document.addEventListener("astro:before-preparation", start);
    document.addEventListener("astro:page-load", finish);
    return () => {
      clearTimers();
      document.removeEventListener("astro:before-preparation", start);
      document.removeEventListener("astro:page-load", finish);
    };
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="fixed top-0 left-0 h-0.5 z-[60] pointer-events-none bg-gradient-to-r from-primary to-secondary"
      style={{ width: "0%", opacity: 0 }}
    />
  );
}

export default NavigationProgress;
