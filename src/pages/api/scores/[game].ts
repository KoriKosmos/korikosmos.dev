import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve('./data/scores');

// Validation constants
const MAX_TETRIS_SCORE = 10000000;
const MAX_RPS_FIELD_VALUE = 1000000;

// Validation schemas
interface TetrisScore {
  name: string;
  score: number;
}

interface RPSScore {
  name: string;
  playerWins: number;
  cpuWins: number;
  ties: number;
}

function isFiniteNumber(value: any): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateBounds(value: number, min: number, max: number, fieldName: string): { valid: boolean; error?: string } {
  if (value < min || value > max) {
    return { valid: false, error: `${fieldName} must be between ${min} and ${max.toLocaleString()}` };
  }
  return { valid: true };
}

function validateTetrisScore(body: any): { valid: boolean; data?: TetrisScore; error?: string } {
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return { valid: false, error: 'Name is required and must be a non-empty string' };
  }
  
  if (!isFiniteNumber(body.score)) {
    return { valid: false, error: 'Score must be a finite number' };
  }
  
  const boundsCheck = validateBounds(body.score, 0, MAX_TETRIS_SCORE, 'Score');
  if (!boundsCheck.valid) {
    return boundsCheck;
  }
  
  return {
    valid: true,
    data: {
      name: body.name.trim().slice(0, 20),
      score: Math.floor(body.score)
    }
  };
}

function validateRPSScore(body: any): { valid: boolean; data?: RPSScore; error?: string } {
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return { valid: false, error: 'Name is required and must be a non-empty string' };
  }
  
  if (!isFiniteNumber(body.playerWins)) {
    return { valid: false, error: 'playerWins must be a finite number' };
  }
  
  if (!isFiniteNumber(body.cpuWins)) {
    return { valid: false, error: 'cpuWins must be a finite number' };
  }
  
  if (!isFiniteNumber(body.ties)) {
    return { valid: false, error: 'ties must be a finite number' };
  }
  
  // Validate bounds for all numeric fields
  const playerWinsBounds = validateBounds(body.playerWins, 0, MAX_RPS_FIELD_VALUE, 'playerWins');
  if (!playerWinsBounds.valid) {
    return playerWinsBounds;
  }
  
  const cpuWinsBounds = validateBounds(body.cpuWins, 0, MAX_RPS_FIELD_VALUE, 'cpuWins');
  if (!cpuWinsBounds.valid) {
    return cpuWinsBounds;
  }
  
  const tiesBounds = validateBounds(body.ties, 0, MAX_RPS_FIELD_VALUE, 'ties');
  if (!tiesBounds.valid) {
    return tiesBounds;
  }
  
  return {
    valid: true,
    data: {
      name: body.name.trim().slice(0, 20),
      playerWins: Math.floor(body.playerWins),
      cpuWins: Math.floor(body.cpuWins),
      ties: Math.floor(body.ties)
    }
  };
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
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
  }

  try {
    const db = await getScoresData(game);
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
  if (!game || !['tetris', 'rps'].includes(game)) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
  }

  try {
    const body = await request.json();
    
    // Validate based on game type
    let validationResult;
    if (game === 'tetris') {
      validationResult = validateTetrisScore(body);
    } else if (game === 'rps') {
      validationResult = validateRPSScore(body);
    } else {
      // This should never happen due to the check above, but handle defensively
      validationResult = { valid: false, error: 'Unsupported game type' };
    }
    
    if (!validationResult.valid) {
      return new Response(JSON.stringify({ error: validationResult.error || 'Invalid score data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const updatedScores = await saveScore(game, validationResult.data);
    
    return new Response(JSON.stringify(updatedScores), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to save score' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
