import { useEffect } from 'react';

/**
 * Mandy mode's page behaviours, after amandata.dev's script.js. Renders nothing.
 *
 * Three rules carried over from there:
 * 1. Everything fails open. The hidden pre-reveal state only exists once this
 *    island adds `md-js` to <html>, so no JS (or a late hydration) still leaves
 *    the page fully readable.
 * 2. prefers-reduced-motion lands every effect in its final state instantly.
 * 3. Nothing flashes faster than 3Hz.
 *
 * Hooks, all opt-in by markup:
 * - `[data-md-typewriter]`   types its text out once
 * - `.md-section`            children fade up in a stagger when scrolled to
 *                            (add `.md-section--static` to opt out)
 * - `mark.md-key`            highlighter sweep after its section reveals
 * - `[data-md-count="N"]`    counts up from 0 to N when scrolled to
 */
export function MandyEffects() {
  useEffect(() => {
    let reduce = false;
    try {
      reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch { /* fail open */ }
    const root = document.documentElement;
    root.classList.add('md-js');
    const cleanups: (() => void)[] = [];

    // typewriter
    document.querySelectorAll<HTMLElement>('[data-md-typewriter]').forEach(el => {
      if (reduce) return;
      const full = el.textContent ?? '';
      el.setAttribute('aria-label', full);
      el.textContent = '';
      let i = 0;
      const timer = window.setInterval(() => {
        el.textContent = full.slice(0, ++i);
        if (i >= full.length) window.clearInterval(timer);
      }, 50);
      cleanups.push(() => window.clearInterval(timer));
    });

    // staggered section reveals + key-term sweeps
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.md-main .md-section:not(.md-section--static)'));
    sections.forEach(sec => {
      Array.from(sec.children).forEach((child, i) => {
        if (child.tagName === 'SCRIPT') return;
        child.classList.add('md-reveal');
        (child as HTMLElement).style.setProperty('--d', `${Math.min(i * 70, 560)}ms`);
      });
      sec.querySelectorAll('p').forEach((p, pi) => {
        p.querySelectorAll<HTMLElement>('mark.md-key').forEach((m, mi) => {
          m.style.setProperty('--d', `${350 + pi * 90 + mi * 55}ms`);
        });
      });
    });
    const play = (sec: Element) => sec.querySelectorAll('.md-reveal, mark.md-key').forEach(el => el.classList.add('in'));

    // count-ups
    const counters = Array.from(document.querySelectorAll<HTMLElement>('[data-md-count]'));
    const countUp = (el: HTMLElement) => {
      const target = parseInt(el.dataset.mdCount ?? '0', 10) || 0;
      if (reduce) { el.textContent = String(target); return; }
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - start) / 900, 1);
        el.textContent = String(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (reduce || !('IntersectionObserver' in window)) {
      sections.forEach(play);
      counters.forEach(countUp);
    } else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          play(en.target);
          io.unobserve(en.target);
        });
      }, { threshold: 0.08 });
      sections.forEach(s => io.observe(s));
      const cio = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          countUp(en.target as HTMLElement);
          cio.unobserve(en.target);
        });
      }, { threshold: 0.5 });
      counters.forEach(c => cio.observe(c));
      cleanups.push(() => { io.disconnect(); cio.disconnect(); });
    }

    return () => cleanups.forEach(fn => fn());
  }, []);

  return null;
}

export default MandyEffects;
