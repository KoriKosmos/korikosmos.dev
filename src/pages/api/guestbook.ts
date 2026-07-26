import type { APIRoute } from 'astro';
import { addEntry, getEntries, validateEntry } from '../../lib/guestbook';
import { checkRateLimit, getClientKey } from '../../lib/rateLimit';

export const prerender = false;

/** One signature per client per 30s — enough to stop flooding, cheap to hit twice by accident. */
const COOLDOWN_MS = 30_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async () => {
  try {
    return json({ entries: await getEntries() });
  } catch (error) {
    console.error('[guestbook] read failed:', error);
    return json({ error: 'Could not load the guestbook.' }, 500);
  }
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  // Honeypot: a field hidden from humans via CSS. Bots that fill every input
  // get a 200 with no write, so they have nothing to retry against.
  //
  // Deliberately NOT named "website"/"url" — browser autofill heuristics target
  // URL-ish field names regardless of `autocomplete="off"`, and the form already
  // has a legitimate site field. A false positive here silently drops a real
  // signature, so the trap name must be one no autofiller recognises.
  if (typeof body?.subject === 'string' && body.subject.trim() !== '') {
    return json({ ok: true, entry: null });
  }

  const result = validateEntry({ name: body?.name, message: body?.message, url: body?.url });
  if (!result.ok) return json({ error: result.error }, 400);

  const key = getClientKey(request, clientAddress);
  if (!checkRateLimit('guestbook', key, COOLDOWN_MS)) {
    return json({ error: 'You just signed — give it a moment before posting again.' }, 429);
  }

  try {
    const entry = await addEntry(result.value);
    return json({ ok: true, entry }, 201);
  } catch (error) {
    console.error('[guestbook] write failed:', error);
    return json({ error: 'Could not save your message. Try again shortly.' }, 500);
  }
};
