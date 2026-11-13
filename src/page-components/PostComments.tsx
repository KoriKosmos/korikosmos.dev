// Per-post comments, ported from amandata.dev: no sign-in, just pick a display
// name. Shared by all three skins. The Mandy and retro shells wrap it and
// restyle the DaisyUI classes from outside, the same way as PostReactions.
//
// Limits and types come from ../lib/constants, never ../lib/comments: that
// module imports node:fs, which must stay out of this client bundle.
import { useEffect, useRef, useState } from 'react';
import { COMMENT_MAX, COMMENT_NAME_MAX, type PostComment } from '../lib/constants';

interface Props {
  slug: string;
}

interface CommentsResponse {
  comments?: PostComment[];
  error?: string;
}

type Status = { kind: 'ok' | 'error'; text: string } | null;

/** The display name is remembered per browser so regulars don't retype it. */
const NAME_KEY = 'kk-comment-name';

function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day} at ${time}`;
}

export function PostComments({ slug }: Props) {
  // Comments load on mount, like reactions, so the article never waits on them.
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  // Set once a POST succeeds. Its response is the newer thread, so a slow
  // initial GET that lands afterwards must not overwrite it.
  const posted = useRef(false);

  useEffect(() => {
    let active = true;
    posted.current = false;
    try {
      setName(localStorage.getItem(NAME_KEY) ?? '');
    } catch {
      /* Storage blocked: the name just isn't remembered. */
    }
    fetch(`/api/comments/${encodeURIComponent(slug)}`)
      .then(response => (response.ok ? response.json() : Promise.reject()))
      .then((data: CommentsResponse) => {
        if (active && !posted.current) setComments(data.comments ?? []);
      })
      .catch(() => {
        if (active && !posted.current) setLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/comments/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, body }),
      });
      const data = (await response.json()) as CommentsResponse;
      if (!response.ok || !data.comments) {
        setStatus({ kind: 'error', text: `Error: ${data.error ?? 'Comments are not accepting posts right now.'}` });
        return;
      }
      posted.current = true;
      setComments(data.comments);
      setLoadFailed(false);
      setBody('');
      setStatus({ kind: 'ok', text: 'Posted! Thanks for joining in.' });
      try {
        localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        /* Best effort. */
      }
    } catch {
      setStatus({ kind: 'error', text: 'Error: could not reach the server. Please try again in a moment.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-8 space-y-4" aria-labelledby={`comments-${slug}`}>
      <h2 id={`comments-${slug}`} className="text-sm font-semibold text-base-content/60">
        Comments{comments && comments.length > 0 ? ` (${comments.length})` : ''}
      </h2>

      {comments === null && !loadFailed && <p className="text-base-content/60">Loading comments…</p>}
      {loadFailed && comments === null && (
        <p className="text-base-content/60">Comments could not be loaded right now.</p>
      )}
      {comments && comments.length === 0 && (
        <p className="text-base-content/60">No comments yet. Start the conversation?</p>
      )}
      {comments && comments.length > 0 && (
        <ul className="space-y-3">
          {comments.map(comment => (
            <li key={comment.id} className="bg-base-200 rounded-xl p-4 shadow">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">{comment.name}</span>
                <time dateTime={comment.date} suppressHydrationWarning className="text-sm text-base-content/60">
                  {formatStamp(comment.date)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="bg-base-200 rounded-xl p-4 shadow space-y-3">
        <div className="form-control">
          <label className="label" htmlFor={`comment-name-${slug}`}>
            <span className="label-text font-semibold">Display name</span>
          </label>
          <input
            id={`comment-name-${slug}`}
            type="text"
            className="input input-bordered w-full"
            value={name}
            onChange={event => setName(event.target.value)}
            maxLength={COMMENT_NAME_MAX}
            autoComplete="nickname"
            required
          />
        </div>
        <div className="form-control">
          <label className="label" htmlFor={`comment-body-${slug}`}>
            <span className="label-text font-semibold">Comment</span>
          </label>
          <textarea
            id={`comment-body-${slug}`}
            className="textarea textarea-bordered w-full"
            rows={4}
            value={body}
            onChange={event => setBody(event.target.value)}
            maxLength={COMMENT_MAX}
            required
          />
          <span className="mt-1 text-sm text-base-content/60">
            {body.length}/{COMMENT_MAX}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Posting…' : 'Post comment'}
          </button>
          <span className="text-sm text-base-content/60">No sign-in needed. Be kind.</span>
        </div>
        <div aria-live="polite" className="min-h-[1.5rem]">
          {status && (
            <p className={status.kind === 'ok' ? 'text-success font-medium' : 'text-error font-medium'}>
              {status.text}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

export default PostComments;
