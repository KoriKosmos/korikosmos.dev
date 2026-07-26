import type { APIRoute } from 'astro';
import { getGuestbook, signGuestbook } from '../../lib/guestbook';

export const GET: APIRoute = async () => {
  const entries = await getGuestbook();
  return new Response(JSON.stringify({ entries }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await signGuestbook((body ?? {}) as Record<string, unknown>);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ entries: result.entries }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
