// The retro skin's headline feature: a 2003-grade guestbook CGI, except it's a
// React island talking to /api/guestbook.
//
// NOTE: the limits and the entry type come from ../lib/constants, not
// ../lib/guestbook — that module has top-level `node:fs` / `async-mutex`
// imports and would poison this client:load bundle. constants.ts is the one
// source of truth, so this form and the server agree on every limit.
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
  const day = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day} @ ${time}`;
}

export function RetroGuestbookPage({ entries: initial }: Props) {
  const [entries, setEntries] = useState<GuestbookEntry[]>(initial);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const count = entries.length;
  // Odometer, zero-padded like every guestbook CGI ever written.
  const countDigits = String(count).padStart(4, '0').split('');

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
      setStatus({ kind: 'ok', text: 'Success! Thank you for signing my guestbook!! (づ｡◕‿‿◕｡)づ' });
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
    <div className="rt-stack">
      {/* ---------------- Banner ---------------- */}
      <div className="rt-panel">
        <div className="rt-panel__title">GUESTBOOK.CGI</div>
        <div className="rt-panel__body rt-center">
          <h1 className="rt-heading" style={{ marginBottom: '4px' }}>
            <span className="rt-rainbow">Sign My Guestbook!</span>
          </h1>
          <img
            className="rt-blinkie"
            src="/retro/blinkies/guestbook.svg"
            alt="Please sign my guestbook"
            width="150"
            height="20"
          />
          <p className="rt-alt rt-small" style={{ margin: '6px 0 0' }}>
            <img
              src="/retro/gfx/mascot.svg"
              alt=""
              width="72"
              height="72"
              style={{ verticalAlign: 'middle', marginRight: '6px' }}
            />
            You made it all the way down here, so you may as well leave a note.{' '}
            <span className="rt-wobble">Say hi!</span>
          </p>

          <div className="rt-hr rt-hr--hearts"></div>

          <div className="rt-row" style={{ justifyContent: 'center' }}>
            <span className="rt-counter" aria-hidden="true">
              {countDigits.map((digit, index) => (
                <span className="rt-counter__digit" key={`${index}-${digit}`}>
                  {digit}
                </span>
              ))}
            </span>
            <span className="rt-alt rt-small">
              {count === 1 ? '1 person has signed!' : `${count} people have signed!`}
            </span>
          </div>
          <p className="rt-note" style={{ margin: '6px 0 0' }}>
            No accounts, no cookies, no algorithm. Just names in a book. ✧･ﾟ
          </p>
        </div>
      </div>

      {/* ---------------- The form ---------------- */}
      <div className="rt-panel">
        <div className="rt-panel__title">Add Your Entry</div>
        <div className="rt-panel__body">
          <form onSubmit={handleSubmit}>
            <label className="rt-label" htmlFor="rt-gb-name">
              Your name <span aria-hidden="true">*</span>
            </label>
            <input
              className="rt-field"
              id="rt-gb-name"
              name="name"
              type="text"
              required
              maxLength={NAME_MAX}
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="a cool web surfer"
              autoComplete="nickname"
            />

            <label className="rt-label" htmlFor="rt-gb-message">
              Your message <span aria-hidden="true">*</span>
            </label>
            <textarea
              className="rt-field"
              id="rt-gb-message"
              name="message"
              required
              rows={6}
              maxLength={MESSAGE_MAX}
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder="cool site!!! how did you make the stars??"
            />
            <p className="rt-note" style={{ margin: '2px 0 0' }}>
              {MESSAGE_MAX - message.length} characters left.
            </p>

            <label className="rt-label" htmlFor="rt-gb-url">
              Your homepage (optional)
            </label>
            <input
              className="rt-field"
              id="rt-gb-url"
              name="url"
              type="text"
              maxLength={URL_MAX}
              value={url}
              onChange={event => setUrl(event.target.value)}
              placeholder="your homepage"
              autoComplete="url"
            />
            <p className="rt-note" style={{ margin: '2px 0 0' }}>
              Plain domains are fine — "example.com" gets an https:// for free.
            </p>

            <div className="rt-row" style={{ marginTop: '12px' }}>
              <button className="rt-btn rt-btn--primary" type="submit" disabled={busy}>
                {busy ? 'Signing…' : '✎ Sign the guestbook!'}
              </button>
              <span className="rt-note">
                <span aria-hidden="true">*</span> required, obviously
              </span>
            </div>

            {/* Always mounted so the live region actually announces. */}
            <div className="rt-row" aria-live="polite" style={{ marginTop: '10px' }}>
              {status && (
                <div className={status.kind === 'ok' ? 'rt-inset rt-alt rt-small rt-glow' : 'rt-inset rt-alt rt-small'}>
                  {status.kind === 'ok' ? '✔ ' : '✖ '}
                  {status.text}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="rt-hr"></div>

      {/* ---------------- The entries ---------------- */}
      <div className="rt-panel">
        <div className="rt-panel__title">
          The Book <span aria-hidden="true">— newest first</span>
        </div>
        <div className="rt-panel__body">
          <h2 className="rt-subhead" style={{ marginTop: 0 }}>
            Everyone who stopped by
          </h2>

          {count === 0 ? (
            <div className="rt-inset rt-center">
              <p style={{ marginBottom: '4px' }}>
                <span className="rt-blink">The guestbook is empty!</span>
              </p>
              <p className="rt-note" style={{ margin: 0 }}>
                Nobody has signed yet. This is your moment. ヽ(•‿•)ノ
              </p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {entries.map((entry, index) => (
                <li key={entry.id}>
                  <div className="rt-gb-entry">
                    <p className="rt-gb-entry__head" style={{ marginBottom: '4px' }}>
                      <span aria-hidden="true">#{count - index} — </span>
                      <span className="rt-gb-entry__name">
                        {entry.url ? (
                          <a href={entry.url} rel="nofollow ugc noopener" target="_blank">
                            {entry.name}
                          </a>
                        ) : (
                          entry.name
                        )}
                      </span>{' '}
                      wrote on{' '}
                      <time dateTime={entry.date} suppressHydrationWarning>
                        {formatStamp(entry.date)}
                      </time>
                      {index === 0 && (
                        <>
                          {' '}
                          <img
                            className="rt-pixel"
                            src="/retro/gfx/new.svg"
                            alt="Newest entry"
                            width="36"
                            height="16"
                          />
                        </>
                      )}
                    </p>
                    <p className="rt-gb-entry__body" style={{ margin: 0 }}>
                      {entry.message}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rt-hr rt-hr--stars"></div>

      <div className="rt-panel">
        <div className="rt-panel__title rt-panel__title--plain">Guestbook Rules (1999 edition)</div>
        <div className="rt-panel__body">
          <ul className="rt-alt rt-small" style={{ marginBottom: 0 }}>
            <li>Be nice. This is a homepage, not a comment section.</li>
            <li>Entries are stored in a JSON file on my server. That's the whole database.</li>
            <li>Links get <code>rel="nofollow"</code>, so please don't bother.</li>
            <li>The last 200 signatures are kept. Older ones ride off into the sunset.</li>
          </ul>
          <p className="rt-note" style={{ margin: '8px 0 0' }}>
            <span className="rt-mono">[SYSTEM]</span> guestbook daemon running nominally. Best viewed at 1024 × 768.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RetroGuestbookPage;
