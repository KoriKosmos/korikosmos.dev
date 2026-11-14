import type { APIRoute } from 'astro';
import { getVitalsTrend } from '../../lib/vitalsHistory';

// The /about card's seven-day trend. It changes a few times a day at most, so
// a short shared cache is plenty.
export const GET: APIRoute = async () => new Response(JSON.stringify(await getVitalsTrend()), {
  status: 200,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
});
