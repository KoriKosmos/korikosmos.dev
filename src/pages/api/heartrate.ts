import type { APIRoute } from 'astro';
import { getHeartRate } from '../../lib/heartRate';

// One cached upstream call is shared by every visitor (HEALTH_CACHE_MS /
// HEART_CACHE_MS), so Health Display and Pulsoid see a steady trickle no matter
// how many people have the site open.
export const GET: APIRoute = async () => new Response(JSON.stringify(await getHeartRate()), {
  status: 200,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
