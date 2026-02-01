import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve('./data/scores');

// Ensure DB file and structure exists
async function getScoresData(game: string) {
  const dbPath = path.join(DATA_DIR, `${game}.json`);
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed.scores)) {
      return { scores: [] };
    }
    return parsed;
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const initial = { scores: [] };
      await fs.writeFile(dbPath, JSON.stringify(initial));
      return initial;
    }
    throw error;
  }
}

async function saveScore(game: string, newScore: any) {
  const db = await getScoresData(game);
  const scores = db.scores;
  const dbPath = path.join(DATA_DIR, `${game}.json`);
  
  // Find existing user
  const existingIndex = scores.findIndex((s: any) => s.name === newScore.name);
  
  if (game === 'tetris') {
      // Tetris: Simple High Score
      if (existingIndex !== -1) {
        if (newScore.score > scores[existingIndex].score) {
          scores[existingIndex].score = newScore.score;
        }
      } else {
        scores.push(newScore);
      }
      scores.sort((a: any, b: any) => b.score - a.score);
      
  } else if (game === 'rps') {
      // RPS: Net Score (Player Wins - CPU Wins)
      // Payload: { name, playerWins, cpuWins, ties }
      const netScore = newScore.playerWins - newScore.cpuWins;
      const entry = {
          name: newScore.name,
          netScore: netScore,
          playerWins: newScore.playerWins,
          cpuWins: newScore.cpuWins,
          ties: newScore.ties
      };

      if (existingIndex !== -1) {
        // Only update if current net score > stored net score
        if (netScore > (scores[existingIndex].netScore || -Infinity)) {
          scores[existingIndex] = entry;
        }
      } else {
        scores.push(entry);
      }
      scores.sort((a: any, b: any) => b.netScore - a.netScore);
  }

  const topScores = scores.slice(0, 10); // Keep top 10
  db.scores = topScores;
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
  return topScores;
}

export const GET: APIRoute = async ({ params }) => {
  const game = params.game;
  if (!game || !['tetris', 'rps'].includes(game)) {
      return new Response(JSON.stringify({ error: 'Game not found' }), { status: 404 });
  }

  try {
    const db = await getScoresData(game);
    return new Response(JSON.stringify(db.scores), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch scores' }), { status: 500 });
  }
}

export const POST: APIRoute = async ({ request, params }) => {
  const game = params.game;
  if (!game || !['tetris', 'rps'].includes(game)) {
      return new Response(JSON.stringify({ error: 'Game not found' }), { status: 404 });
  }

  try {
    const body = await request.json();
    if (!body.name) {
        return new Response(JSON.stringify({ error: 'Invalid score data' }), { status: 400 });
    }
    
    // Validate payload shape? For now, trust the client types for speed
    const updatedScores = await saveScore(game, { ...body, name: body.name.trim().slice(0, 20) });
    
    return new Response(JSON.stringify(updatedScores), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to save score' }), { status: 500 });
  }
}
