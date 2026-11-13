/**
 * Blog comments, shared by all three skins' post pages. Ported from
 * amandata.dev: no sign-in, just a display name and a message.
 *
 * Stored as `{ [slug]: PostComment[] }` in data/comments.json through
 * lib/jsonStore.ts (per-file mutex + atomic rename), like the guestbook. The
 * API route checks slugs against the blog collection, so the file can only
 * grow keys for real posts.
 */
import { readJson, updateJson } from './jsonStore';
import { COMMENT_MAX, COMMENT_NAME_MAX, type PostComment } from './constants';

const FILE = 'comments.json';

type CommentFile = Record<string, PostComment[]>;

const EMPTY: CommentFile = {};

/**
 * Per-post cap. Like the guestbook's, it *rejects* rather than evicts: on an
 * unauthenticated endpoint, `slice(-MAX)` would let a flood silently erase
 * every real comment. A full thread is fixed by pruning the file.
 */
export const MAX_COMMENTS_PER_POST = 200;

function isComment(value: unknown): value is PostComment {
  const c = value as PostComment;
  return Boolean(
    c && typeof c.id === 'string' && typeof c.date === 'string' && typeof c.name === 'string' && typeof c.body === 'string'
  );
}

function commentsOf(file: unknown, slug: string): PostComment[] {
  const list = (file as CommentFile | null)?.[slug];
  return Array.isArray(list) ? list.filter(isComment) : [];
}

/** Oldest first, so a thread reads top to bottom like a conversation. */
const oldestFirst = (comments: PostComment[]) =>
  [...comments].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

class ThreadFull extends Error {}

export async function getComments(slug: string): Promise<PostComment[]> {
  return oldestFirst(commentsOf(await readJson<unknown>(FILE, EMPTY), slug));
}

export type CommentResult =
  | { ok: true; comments: PostComment[] }
  | { ok: false; error: string };

export async function addComment(slug: string, input: { name?: unknown; body?: unknown }): Promise<CommentResult> {
  const name = typeof input.name === 'string' ? input.name.trim().slice(0, COMMENT_NAME_MAX) : '';
  const body = typeof input.body === 'string' ? input.body.trim().slice(0, COMMENT_MAX) : '';

  if (!name) return { ok: false, error: 'Please pick a display name.' };
  if (!body) return { ok: false, error: 'Please write a comment.' };

  const comment: PostComment = { id: crypto.randomUUID(), date: new Date().toISOString(), name, body };

  try {
    const saved = await updateJson<unknown>(FILE, EMPTY, current => {
      const file = current && typeof current === 'object' ? (current as CommentFile) : EMPTY;
      const comments = commentsOf(file, slug);
      if (comments.length >= MAX_COMMENTS_PER_POST) throw new ThreadFull();
      return { ...file, [slug]: [...comments, comment] } satisfies CommentFile;
    });
    return { ok: true, comments: oldestFirst(commentsOf(saved, slug)) };
  } catch (error) {
    if (error instanceof ThreadFull) {
      return { ok: false, error: 'This post has all the comments it can hold. Sign the guestbook instead?' };
    }
    console.error('[comments] write failed', error);
    return { ok: false, error: 'Comments are not accepting posts right now.' };
  }
}
