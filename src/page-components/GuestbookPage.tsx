// Modern-skin guestbook. Same data, same API, same behaviour as
// retro-components/RetroGuestbookPage.tsx — just dressed in Tailwind + DaisyUI.
//
// The limits and the entry type come from ../lib/constants, not ../lib/guestbook:
// that module imports node:fs and async-mutex at the top level, so a value
// import would drag them into this client:load bundle. constants.ts is the one
// source of truth for the limits, so the character counter here and the
// truncation on the server can't disagree.
import { useState } from 'react';
import { MESSAGE_MAX, NAME_MAX, URL_MAX, type GuestbookEntry } from '../lib/constants';

interface Props {
  entries: GuestbookEntry[];
}

interface GuestbookResponse {
  entries?: GuestbookEntry[];
  error?: string;
}

type Status = { kind: 'ok' | 'error'; text: string } | null;

function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day} at ${time}`;
}

export function GuestbookPage({ entries: initial }: Props) {
  const [entries, setEntries] = useState<GuestbookEntry[]>(initial);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const count = entries.length;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setStatus(null);

    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, url }),
      });
      const data = (await response.json()) as GuestbookResponse;

      if (!response.ok || !data.entries) {
        setStatus({
          kind: 'error',
          text: `Error: ${data.error ?? 'The guestbook is not accepting signatures right now.'}`,
        });
        return;
      }

      setEntries(data.entries);
      setName('');
      setMessage('');
      setUrl('');
      setStatus({ kind: 'ok', text: 'Signed! Thanks for stopping by.' });
    } catch {
      setStatus({
        kind: 'error',
        text: 'Error: could not reach the guestbook server. Please try again in a moment.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="my-8 space-y-8">
      <header>
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent inline-block">
          Guestbook
        </h1>
        <p className="mt-2 text-base-content/60">
          The good part of the old web: leave a note, no account required.{' '}
          {count === 1 ? '1 person has signed' : `${count} people have signed`} so far.
        </p>
      </header>

      <div className="bg-base-200 rounded-xl p-6 shadow space-y-4">
        <h2 className="text-2xl font-bold">Sign it</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="form-control">
              <label className="label" htmlFor="gb-name">
                <span className="label-text font-semibold">Name</span>
              </label>
              <input
                id="gb-name"
                name="name"
                type="text"
                required
                maxLength={NAME_MAX}
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="who's visiting?"
                autoComplete="nickname"
                className="input input-bordered w-full"
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="gb-url">
                <span className="label-text font-semibold">
                  Website <span className="text-base-content/60 font-normal">(optional)</span>
                </span>
              </label>
              <input
                id="gb-url"
                name="url"
                type="text"
                maxLength={URL_MAX}
                value={url}
                onChange={event => setUrl(event.target.value)}
                placeholder="your homepage"
                autoComplete="url"
                className="input input-bordered w-full"
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label" htmlFor="gb-message">
              <span className="label-text font-semibold">Message</span>
            </label>
            <textarea
              id="gb-message"
              name="message"
              required
              rows={5}
              maxLength={MESSAGE_MAX}
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder="say hello…"
              className="textarea textarea-bordered w-full"
            />
            <span className="mt-1 text-sm text-base-content/60">
              {MESSAGE_MAX - message.length} characters left.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Signing…' : 'Sign the guestbook'}
            </button>
            <span className="text-sm text-base-content/60">Links are nofollow. Be kind.</span>
          </div>

          {/* Always mounted so screen readers announce the change. */}
          <div aria-live="polite" className="min-h-[1.5rem]">
            {status && (
              <p className={status.kind === 'ok' ? 'text-success font-medium' : 'text-error font-medium'}>
                {status.kind === 'ok' ? '✓ ' : '✕ '}
                {status.text}
              </p>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Entries</h2>

        {count === 0 ? (
          <div className="bg-base-200 rounded-xl p-6 shadow">
            <p className="text-base-content/60">No one has signed yet — you could be the first.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {entries.map(entry => (
              <li key={entry.id} className="bg-base-200 rounded-xl p-5 shadow">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-lg">
                    {entry.url ? (
                      <a href={entry.url} rel="nofollow ugc noopener" target="_blank" className="link link-primary">
                        {entry.name}
                      </a>
                    ) : (
                      entry.name
                    )}
                  </span>
                  <time dateTime={entry.date} suppressHydrationWarning className="text-sm text-base-content/60">
                    {formatStamp(entry.date)}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words">{entry.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default GuestbookPage;
