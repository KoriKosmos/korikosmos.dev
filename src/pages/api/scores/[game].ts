import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Mutex } from 'async-mutex';

const DATA_DIR = path.resolve('./data/scores');

// Mutex map for per-game locking
const locks = new Map<string, Mutex>();

function getLock(game: string) {
  if (!locks.has(game)) {
    locks.set(game, new Mutex());
  }
  return locks.get(game)!;
}

// Validation Helpers
function isValidScore(n: any): boolean {
  return typeof n === 'number' && Number.isFinite(n);
}

function isValidGame(game: any): game is 'tetris' | 'rps' {
  return typeof game === 'string' && ['tetris', 'rps'].includes(game);
}

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
      // No lock needed here as this is just initialization, but ideally wrapped too.
      // For now, atomic write in saveScore covers the race mostly.
      await fs.writeFile(dbPath, JSON.stringify(initial));
      return initial;
    }
    throw error;
  }
}

async function saveScore(game: string, newScore: any) {
  const lock = getLock(game);
  
  return await lock.runExclusive(async () => {
      const dbPath = path.join(DATA_DIR, `${game}.json`);
      const db = await getScoresData(game);
      const scores = db.scores;
      
      const existingIndex = scores.findIndex((s: any) => s.name === newScore.name);
      
      if (game === 'tetris') {
          if (existingIndex !== -1) {
            if (newScore.score > scores[existingIndex].score) {
              scores[existingIndex].score = newScore.score;
            }
          } else {
            scores.push(newScore);
          }
          scores.sort((a: any, b: any) => b.score - a.score);
          
      } else if (game === 'rps') {
          const netScore = newScore.playerWins - newScore.cpuWins;
          const entry = {
              name: newScore.name,
              netScore: netScore,
              playerWins: newScore.playerWins,
              cpuWins: newScore.cpuWins,
              ties: newScore.ties
          };

          if (existingIndex !== -1) {
            if (netScore > (scores[existingIndex].netScore || -Infinity)) {
              scores[existingIndex] = entry;
            }
          } else {
            scores.push(entry);
          }
          scores.sort((a: any, b: any) => b.netScore - a.netScore);
      }

      const topScores = scores.slice(0, 10);
      db.scores = topScores;
      
      // Atomic Write: Write to temp file then rename
      const tempPath = `${dbPath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(db, null, 2));
      await fs.rename(tempPath, dbPath);
      
      return topScores;
  });
}

export const GET: APIRoute = async ({ params }) => {
  const game = params.game;
  if (!isValidGame(game)) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
  }

  try {
    // Read lock? strict consistency might require it, but for high scores dirty read is ok.
    // However, concurrent write might corrupt a read. Let's use the lock for consistency.
    const lock = getLock(game);
    const db = await lock.runExclusive(() => getScoresData(game));
    return new Response(JSON.stringify(db.scores), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch scores' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const POST: APIRoute = async ({ request, params }) => {
  const game = params.game;
  if (!isValidGame(game)) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
  }

  try {
    const body = await request.json();
    
    // Strict Input Validation
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'Invalid name' }), { status: 400 });
    }

    const sanitizedName = body.name.trim().slice(0, 20);

    let payload: any = { name: sanitizedName };

    if (game === 'tetris') {
        if (!isValidScore(body.score)) {
            return new Response(JSON.stringify({ error: 'Invalid score' }), { status: 400 });
        }
        payload.score = body.score;
    } else if (game === 'rps') {
        if (!isValidScore(body.playerWins) || !isValidScore(body.cpuWins) || !isValidScore(body.ties)) {
             return new Response(JSON.stringify({ error: 'Invalid RPS stats' }), { status: 400 });
        }
        payload.playerWins = body.playerWins;
        payload.cpuWins = body.cpuWins;
        payload.ties = body.ties;
    }

    const updatedScores = await saveScore(game, payload);
    
    return new Response(JSON.stringify(updatedScores), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Failed to save score' }), { status: 500 });
  }
}
