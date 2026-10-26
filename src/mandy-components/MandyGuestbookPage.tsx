// Mandy-mode guestbook. Same data, same API, same behaviour as
// page-components/GuestbookPage.tsx and retro-components/RetroGuestbookPage.tsx,
// dressed in the md-* vocabulary. A separate body rather than a wrapper because
// GuestbookPage renders its own gradient <h1> header, which would clash with
// (and duplicate) the Mandy page head.
//
// The limits and the entry type come from ../lib/constants, not ../lib/guestbook:
// that module imports node:fs and async-mutex at the top level, so a value
// import would drag them into this client:load bundle. The server sanitises
// `url` (http/https only) before it is ever stored, so entry.url is safe to
// render as an href; links still get rel="nofollow ugc noopener".
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

export function MandyGuestbookPage({ entries: initial }: Props) {
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
    <>
      <section className="md-section md-section--first md-section--static">
        <div className="md-section__head">
          <h1 className="md-section__title">Guestbook</h1>
          <span className="md-section__tag">// {count === 1 ? '1 signature' : `${count} signatures`}</span>
        </div>
        <div className="md-section__body">
          <p>
            The good part of the old web: leave a note, no account required. Gotta sign 'em all.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="md-entry" style={{ borderLeftColor: 'var(--md-accent)' }}>
          <h2 className="md-subhead" style={{ marginTop: 0 }}>Sign it</h2>
          <div className="md-form-row">
            <div>
              <label className="md-label" htmlFor="md-gb-name">Name</label>
              <input
                id="md-gb-name"
                name="name"
                type="text"
                required
                maxLength={NAME_MAX}
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="who's visiting?"
                autoComplete="nickname"
                className="md-field"
              />
            </div>
            <div>
              <label className="md-label" htmlFor="md-gb-url">Website (optional)</label>
              <input
                id="md-gb-url"
                name="url"
                type="text"
                maxLength={URL_MAX}
                value={url}
                onChange={event => setUrl(event.target.value)}
                placeholder="your homepage"
                autoComplete="url"
                className="md-field"
              />
            </div>
          </div>

          <label className="md-label" htmlFor="md-gb-message">Message</label>
          <textarea
            id="md-gb-message"
            name="message"
            required
            rows={5}
            maxLength={MESSAGE_MAX}
            value={message}
            onChange={event => setMessage(event.target.value)}
            placeholder="say hello…"
            className="md-field"
          />
          <span className="md-note">{MESSAGE_MAX - message.length} characters left.</span>

          <div className="md-form-actions">
            <button type="submit" className="md-btn" disabled={busy}>
              {busy ? 'Signing…' : 'Sign the guestbook'}
            </button>
            <span className="md-note">Links are nofollow. Be kind.</span>
          </div>

          {/* Always mounted so screen readers announce the change. */}
          <div aria-live="polite" className="md-status">
            {status && (
              <p className={status.kind === 'ok' ? 'md-status--ok' : 'md-status--error'}>
                {status.kind === 'ok' ? '✓ ' : '✕ '}
                {status.text}
              </p>
            )}
          </div>
        </form>
      </section>

      <section className="md-section md-section--static" style={{ paddingTop: '2rem' }}>
        <div className="md-section__head">
          <h2 className="md-section__title">Entries</h2>
        </div>

        {count === 0 ? (
          <p className="md-note">No one has signed yet. You could be the first.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {entries.map(entry => (
              <li key={entry.id} className="md-entry">
                <div className="md-entry__meta">
                  <span className="md-entry__title" style={{ fontFamily: 'var(--md-body)', letterSpacing: 0 }}>
                    {entry.url ? (
                      <a href={entry.url} rel="nofollow ugc noopener" target="_blank">
                        {entry.name}
                      </a>
                    ) : (
                      entry.name
                    )}
                  </span>
                  <time dateTime={entry.date} suppressHydrationWarning>
                    {formatStamp(entry.date)}
                  </time>
                </div>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: 'var(--md-body-text)' }}>
                  {entry.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default MandyGuestbookPage;
