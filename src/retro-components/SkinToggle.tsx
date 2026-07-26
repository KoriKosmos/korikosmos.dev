import { useState } from 'react';

/**
 * Switches the site between the modern skin and the Web 1.0 one.
 *
 * The skin is a cookie rather than a class because the two skins are different
 * documents — different shell, different page bodies, server-rendered. So this
 * writes the cookie and does a **full** navigation: `location.reload()`, not
 * Astro's ClientRouter, which would swap in markup from the old skin's shell.
 */

const SKIN_COOKIE = 'kk-skin';
const ONE_YEAR = 60 * 60 * 24 * 365;

interface Props {
  /** The skin currently rendering, so the button offers the other one. */
  skin: 'modern' | 'retro';
}

export function SkinToggle({ skin }: Props) {
  const [busy, setBusy] = useState(false);
  const target = skin === 'retro' ? 'modern' : 'retro';

  const flip = () => {
    setBusy(true);
    document.cookie = `${SKIN_COOKIE}=${target}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    window.location.reload();
  };

  const label =
    target === 'retro' ? 'Switch to the Web 1.0 version of this site' : 'Switch back to the modern site';

  if (skin === 'retro') {
    return (
      <div className="rt-dock rt-dock--bl">
        <button type="button" className="rt-btn" onClick={flip} disabled={busy} aria-label={label}>
          {busy ? 'Loading…' : '⇦ Back to 20XX'}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        type="button"
        onClick={flip}
        disabled={busy}
        aria-label={label}
        title={label}
        className="flex items-center gap-2 rounded border border-base-content/20 bg-base-200/80 px-3 py-2 text-sm backdrop-blur transition-transform duration-200 hover:scale-105 disabled:opacity-60"
      >
        <span aria-hidden="true">🌐</span>
        {busy ? 'Loading…' : 'Web 1.0 mode'}
      </button>
    </div>
  );
}

export default SkinToggle;
