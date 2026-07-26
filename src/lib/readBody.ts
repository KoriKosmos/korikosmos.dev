/**
 * Read a request body with a hard byte ceiling, aborting mid-stream.
 *
 * The obvious version — `await request.text()` then check `.length` — does not
 * actually protect anything: `text()` buffers the whole body into memory
 * *before* the check can run, so an unauthenticated client sending a chunked
 * body with no `Content-Length` can make the process allocate as much as it
 * likes and only be told off afterwards.
 *
 * This reads the stream chunk by chunk and cancels as soon as the running
 * total crosses the limit, so the peak allocation is bounded by `maxBytes`
 * plus one chunk. `Content-Length`, when present, is still checked up front so
 * an honest oversized request is refused without reading anything at all.
 */
export type ReadBodyResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'too-large' };

export async function readBodyCapped(
  request: Request,
  maxBytes: number,
): Promise<ReadBodyResult> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, reason: 'too-large' };
  }

  const body = request.body;
  // No stream (e.g. an empty body) — nothing to cap.
  if (!body) return { ok: true, text: '' };

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        // Stop the sender rather than draining the rest of the body.
        await reader.cancel();
        return { ok: false, reason: 'too-large' };
      }
      chunks.push(value);
    }
  } catch {
    // A truncated or aborted upload is not a body we can parse.
    return { ok: false, reason: 'too-large' };
  }

  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, text: new TextDecoder().decode(joined) };
}
