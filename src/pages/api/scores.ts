import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

const DB_PATH = path.resolve('./data/highscores.json');

// Ensure DB file and structure exists
async function getScoresData() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    // Ensure it has the correct shape for CMS
    if (!Array.isArray(parsed.scores)) {
      return { scores: [] };
    }
    return parsed;
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      const initial = { scores: [] };
      await fs.writeFile(DB_PATH, JSON.stringify(initial));
      return initial;
    }
    throw error;
  }
}

async function saveScore(newScore: { name: string; score: number }) {
  const db = await getScoresData();
  const scores = db.scores;
  
  // Find existing user
  const existingIndex = scores.findIndex((s: any) => s.name === newScore.name);
  
  if (existingIndex !== -1) {
    // Only update if new score is higher
    if (newScore.score > scores[existingIndex].score) {
      scores[existingIndex].score = newScore.score;
    }
  } else {
    scores.push(newScore);
  }

  scores.sort((a: any, b: any) => b.score - a.score);
  const topScores = scores.slice(0, 10); // Keep top 10
  
  db.scores = topScores;
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
  return topScores;
}

export const GET: APIRoute = async () => {
  try {
    const db = await getScoresData();
    return new Response(JSON.stringify(db.scores), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch scores' }), { status: 500 });
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body.name || typeof body.score !== 'number') {
        return new Response(JSON.stringify({ error: 'Invalid score data' }), { status: 400 });
    }
    const updatedScores = await saveScore({ name: body.name.trim().slice(0, 20), score: body.score });
    return new Response(JSON.stringify(updatedScores), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to save score' }), { status: 500 });
  }
}
