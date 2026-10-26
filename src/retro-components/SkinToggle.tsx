import { useState } from 'react';

/**
 * Switches the site between its three skins: modern, Web 1.0, and Mandy mode.
 *
 * The skin is a cookie rather than a class because the skins are different
 * documents — different shell, different page bodies, server-rendered. So this
 * writes the cookie and does a **full** navigation: `location.reload()`, not
 * Astro's ClientRouter, which would swap in markup from the old skin's shell.
 *
 * Each shell renders this with its own skin, and it offers the other two.
 */

type Skin = 'modern' | 'retro' | 'mandy';

const SKIN_COOKIE = 'kk-skin';
const ONE_YEAR = 60 * 60 * 24 * 365;

const LABELS: Record<Skin, { short: string; aria: string; icon: string }> = {
  modern: { short: 'Modern', aria: 'Switch back to the modern site', icon: '✦' },
  retro: { short: 'Web 1.0 mode', aria: 'Switch to the Web 1.0 version of this site', icon: '🌐' },
  mandy: { short: 'Mandy mode', aria: 'Switch to Mandy mode, the pixel fandom version of this site', icon: '🦇' },
};

interface Props {
  /** The skin currently rendering, so the buttons offer the other two. */
  skin: Skin;
}

export function SkinToggle({ skin }: Props) {
  const [busy, setBusy] = useState<Skin | null>(null);
  const targets = (['modern', 'retro', 'mandy'] as const).filter(s => s !== skin);

  const flip = (target: Skin) => {
    setBusy(target);
    document.cookie = `${SKIN_COOKIE}=${target}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    window.location.reload();
  };

  if (skin === 'retro') {
    return (
      <div className="rt-dock rt-dock--bl" style={{ display: 'flex', gap: 4 }}>
        {targets.map(target => (
          <button
            key={target}
            type="button"
            className="rt-btn"
            onClick={() => flip(target)}
            disabled={busy !== null}
            aria-label={LABELS[target].aria}
          >
            {busy === target ? 'Loading…' : target === 'modern' ? '⇦ Back to 20XX' : LABELS[target].short}
          </button>
        ))}
      </div>
    );
  }

  if (skin === 'mandy') {
    return (
      <div className="md-skins">
        {targets.map(target => (
          <button
            key={target}
            type="button"
            className="md-skins__btn"
            onClick={() => flip(target)}
            disabled={busy !== null}
            aria-label={LABELS[target].aria}
            title={LABELS[target].aria}
          >
            <span aria-hidden="true">{LABELS[target].icon}</span> {busy === target ? 'Loading…' : LABELS[target].short}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex gap-2">
      {targets.map(target => (
        <button
          key={target}
          type="button"
          onClick={() => flip(target)}
          disabled={busy !== null}
          aria-label={LABELS[target].aria}
          title={LABELS[target].aria}
          className="flex items-center gap-2 rounded border border-base-content/20 bg-base-200/80 px-3 py-2 text-sm backdrop-blur transition-transform duration-200 hover:scale-105 disabled:opacity-60"
        >
          <span aria-hidden="true">{LABELS[target].icon}</span>
          {busy === target ? 'Loading…' : LABELS[target].short}
        </button>
      ))}
    </div>
  );
}

export default SkinToggle;
