import { useState, type FormEvent } from 'react';
import {
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  type GuestbookEntry,
} from '../lib/constants';

interface Props {
  /** SSR-fetched in guestbook.astro so the list is in the HTML, not fetched on mount. */
  initialEntries: GuestbookEntry[];
}

// Explicit locale + UTC keep server-rendered and hydrated output identical;
// the visitor's own locale/timezone would produce a hydration mismatch.
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatDate(iso: string) {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.valueOf()) ? '' : dateFormatter.format(parsed);
}

/** Deterministic per-name hue so each signature gets its own avatar colour. */
function hueFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360;
  return hash;
}

export function GuestbookPage({ initialEntries }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  // Honeypot. Named "subject" rather than anything URL-ish so browser autofill
  // won't populate it and cost a real visitor their signature.
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (status === 'sending') return;

    setStatus('sending');
    setError(null);

    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, url, subject }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error ?? 'Something went wrong. Try again shortly.');
        setStatus('idle');
        return;
      }

      // The honeypot path also answers 200, with no entry. Confirming success
      // only when an entry comes back stops a tripped trap from showing a
      // human "thanks for signing!" for a message that was never stored.
      if (!data.entry) {
        setError('That didn’t go through — try again, or email me instead.');
        setStatus('idle');
        return;
      }

      setEntries(current => [data.entry as GuestbookEntry, ...current]);
      setName('');
      setMessage('');
      setUrl('');
      setStatus('sent');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setStatus('idle');
    }
  }

  const remaining = MAX_MESSAGE_LENGTH - message.length;

  return (
    // Lives on the homepage, where TypingHeading is the h1 — hence h2 here.
    <section id="guestbook" className="my-8 space-y-8 text-left scroll-mt-8">
      <header>
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent inline-block">
          Guestbook
        </h2>
        <p className="mt-2 text-base-content/60">
          Say hello, leave a link, tell me what you’re working on. No account, no tracking — just
          the old web.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="bg-base-200 rounded-xl p-6 shadow space-y-4">
        <h3 className="text-2xl font-bold">Sign the guestbook</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Name</span>
            <input
              type="text"
              value={name}
              onChange={event => setName(event.target.value)}
              maxLength={MAX_NAME_LENGTH}
              required
              autoComplete="nickname"
              placeholder="Ada"
              className="mt-1 w-full rounded bg-base-100 border border-base-content/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">
              Your site <span className="font-normal text-base-content/50">(optional)</span>
            </span>
            <input
              type="text"
              value={url}
              onChange={event => setUrl(event.target.value)}
              inputMode="url"
              autoComplete="url"
              placeholder="example.com"
              className="mt-1 w-full rounded bg-base-100 border border-base-content/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold">Message</span>
          <textarea
            value={message}
            onChange={event => setMessage(event.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            required
            rows={3}
            placeholder="Found this via…"
            className="mt-1 w-full rounded bg-base-100 border border-base-content/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span
            className={`block text-right text-xs mt-1 ${remaining < 20 ? 'text-warning' : 'text-base-content/50'}`}
            aria-live="polite"
          >
            {remaining} characters left
          </span>
        </label>

        {/* Honeypot: off-screen and skipped by keyboard/screen readers, so only
            bots that fill every field will populate it. */}
        <div aria-hidden="true" className="absolute w-px h-px -left-[9999px] overflow-hidden">
          <label>
            Subject
            <input
              type="text"
              name="subject"
              tabIndex={-1}
              autoComplete="off"
              value={subject}
              onChange={event => setSubject(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={status === 'sending'}
            className="bg-primary text-primary-content rounded px-5 py-2 font-semibold shadow hover:shadow-lg disabled:opacity-60 transition-all"
          >
            {status === 'sending' ? 'Signing…' : 'Sign'}
          </button>
          {status === 'sent' && (
            <span className="text-success text-sm" role="status">
              Thanks for signing! 💛
            </span>
          )}
          {error && (
            <span className="text-error text-sm" role="alert">
              {error}
            </span>
          )}
        </div>
      </form>

      <div>
        <h3 className="text-2xl font-bold mb-4">
          {entries.length === 0
            ? 'No signatures yet'
            : `${entries.length} ${entries.length === 1 ? 'signature' : 'signatures'}`}
        </h3>

        {entries.length === 0 ? (
          <p className="text-base-content/60">Be the first to sign — the page is yours.</p>
        ) : (
          <ul className="space-y-4">
            {entries.map(entry => (
              <li key={entry.id} className="bg-base-200 rounded-xl p-5 shadow">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid place-items-center w-9 h-9 shrink-0 rounded-full font-bold text-base-100"
                    style={{ backgroundColor: `hsl(${hueFor(entry.name)} 65% 55%)` }}
                  >
                    {entry.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {entry.url ? (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="nofollow ugc noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {entry.name}
                        </a>
                      ) : (
                        entry.name
                      )}
                    </p>
                    <p className="text-xs text-base-content/50">
                      <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                    </p>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line break-words">{entry.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default GuestbookPage;
