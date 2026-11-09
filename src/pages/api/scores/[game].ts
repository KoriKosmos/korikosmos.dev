import type { APIRoute } from 'astro';
import { readJson, updateJson } from '../../../lib/jsonStore';
import { checkRateLimit, getClientKey } from '../../../lib/rateLimit';
import { isSameOrigin } from '../../../lib/sameOrigin';
import { readBodyCapped } from '../../../lib/readBody';
import {
  isGame, mergeRps, mergeTetris, normaliseFile, parseRps, parseTetris,
  type RpsEntry, type ScoreFile, type TetrisEntry,
} from '../../../lib/scores';

/**
 * Game leaderboards (Tetris, Rock Paper Scissors), stored in
 * data/scores/<game>.json. Like the guestbook and reactions, the write path
 * is unauthenticated, so it is same-origin only, body-capped, and throttled.
 * None of that stops someone typing a fake score into devtools — a client-side
 * game can't prove a score — but it stops drive-by posts from other sites and
 * scripted floods.
 */

const MAX_BODY_BYTES = 1024;
/**
 * A burst of 6 per 10s. Tetris posts once per game; Rock Paper Scissors posts
 * every time a winning streak beats the player's best, which can be a few
 * rounds in a row, so this has to tolerate quick clicking.
 */
const WINDOW_MS = 10_000;
const BURST = 6;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });

const fileFor = (game: string) => `scores/${game}.json`;

export const GET: APIRoute = async ({ params }) => {
  const { game } = params;
  if (!isGame(game)) return json({ error: 'Game not found' }, 404);
  const file = normaliseFile(await readJson<unknown>(fileFor(game), null));
  return json(file.scores);
};

export const POST: APIRoute = async (context) => {
  const { request, params, site, url } = context;
  const { game } = params;
  if (!isGame(game)) return json({ error: 'Game not found' }, 404);

  if (!isSameOrigin(request, site, url)) {
    return json({ error: 'Scores can only be submitted from the game page.' }, 403);
  }

  const read = await readBodyCapped(request, MAX_BODY_BYTES);
  if (!read.ok) return json({ error: 'Request body too large' }, 413);

  let body: unknown;
  try {
    body = JSON.parse(read.text);
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ error: 'Invalid JSON body' }, 400);

  // Read lazily: Astro throws on clientAddress when the adapter can't supply
  // one, and the forwarded headers usually make it unnecessary anyway.
  let peer: string | undefined;
  try { peer = context.clientAddress; } catch { peer = undefined; }
  const key = getClientKey(request, peer);
  if (!checkRateLimit(`scores:${game}`, key, WINDOW_MS, BURST)) {
    return json({ error: 'Slow down! Try again in a moment.' }, 429, { 'Retry-After': String(WINDOW_MS / 1000) });
  }

  try {
    if (game === 'tetris') {
      const parsed = parseTetris(body as Record<string, unknown>);
      if (!parsed.ok) return json({ error: parsed.error }, 400);
      const saved = await updateJson<ScoreFile<TetrisEntry>>(fileFor(game), { scores: [] }, current => ({
        scores: mergeTetris(normaliseFile<TetrisEntry>(current).scores, parsed.entry),
      }));
      return json(saved.scores);
    }
    const parsed = parseRps(body as Record<string, unknown>);
    if (!parsed.ok) return json({ error: parsed.error }, 400);
    const saved = await updateJson<ScoreFile<RpsEntry>>(fileFor(game), { scores: [] }, current => ({
      scores: mergeRps(normaliseFile<RpsEntry>(current).scores, parsed.entry),
    }));
    return json(saved.scores);
  } catch (error) {
    console.error('[scores] failed to save', error);
    return json({ error: 'Failed to save score' }, 500);
  }
};
