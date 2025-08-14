import fs from 'node:fs/promises';
import type { APIRoute } from 'astro';

const file = new URL('../../data/tetris-scores.json', import.meta.url);

export const GET: APIRoute = async () => {
  try {
    const data = JSON.parse(await fs.readFile(file, 'utf-8'));
    data.sort((a, b) => b.score - a.score);
    return new Response(JSON.stringify(data.slice(0, 10)));
  } catch {
    return new Response('[]');
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, score } = await request.json();
    if (typeof name !== 'string' || typeof score !== 'number') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }
    let data = [];
    try {
      data = JSON.parse(await fs.readFile(file, 'utf-8'));
    } catch {}
    data.push({ name, score });
    data.sort((a, b) => b.score - a.score);
    data = data.slice(0, 10);
    await fs.writeFile(file, JSON.stringify(data));
    return new Response(JSON.stringify(data));
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to save score' }), { status: 500 });
  }
};
