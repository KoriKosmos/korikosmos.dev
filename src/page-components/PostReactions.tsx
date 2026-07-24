import { useEffect, useState } from 'react';
import { REACTIONS, type ReactionCounts } from '../lib/constants';

interface Props {
  slug: string;
}

/**
 * Which emoji this browser has already sent for a post. Purely a courtesy
 * guard — the counts aren't identity-bound, so this stops accidental
 * double-taps, not someone determined to inflate a number.
 */
function storageKey(slug: string) {
  return `reactions:${slug}`;
}

function readReacted(slug: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function PostReactions({ slug }: Props) {
  // Blog posts are prerendered, so counts can't come from SSR — fetch on mount.
  const [counts, setCounts] = useState<ReactionCounts | null>(null);
  const [reacted, setReacted] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setReacted(readReacted(slug));

    fetch(`/api/reactions/${encodeURIComponent(slug)}`)
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        if (active && data?.counts) setCounts(data.counts as ReactionCounts);
      })
      .catch(() => {
        /* Reactions are decoration — a failed fetch just leaves the bar at zero. */
      });

    return () => {
      active = false;
    };
  }, [slug]);

  async function react(emoji: string) {
    if (pending || reacted.includes(emoji)) return;
    setPending(emoji);

    // Optimistic bump so the tap feels instant; reconciled from the response.
    setCounts(current => ({ ...(current ?? {}), [emoji]: (current?.[emoji] ?? 0) + 1 }));
    const next = [...reacted, emoji];
    setReacted(next);
    try {
      localStorage.setItem(storageKey(slug), JSON.stringify(next));
    } catch {
      /* Private mode / storage disabled — the guard is optional. */
    }

    try {
      const response = await fetch(`/api/reactions/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      const data = await response.json();
      if (response.ok && data?.counts) setCounts(data.counts as ReactionCounts);
    } catch {
      /* Keep the optimistic value; the next page load will correct it. */
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="mt-12 pt-6 border-t border-base-content/10">
      <h2 className="text-sm font-semibold text-base-content/60 mb-3">
        Did this land? Leave a reaction
      </h2>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map(({ emoji, label }) => {
          const active = reacted.includes(emoji);
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => react(emoji)}
              disabled={active || pending !== null}
              aria-pressed={active}
              aria-label={`${label} (${counts?.[emoji] ?? 0} so far)`}
              title={label}
              className={`flex items-center gap-2 rounded-full px-4 py-2 shadow transition-transform disabled:cursor-default ${
                active
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-200 hover:-translate-y-0.5 hover:shadow-lg'
              }`}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {emoji}
              </span>
              <span className="text-sm tabular-nums">{counts?.[emoji] ?? 0}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default PostReactions;
