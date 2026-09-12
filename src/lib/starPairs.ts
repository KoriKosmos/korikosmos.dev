export const DIFFICULTIES = {
  orbit: { label: 'Orbit', pairs: 6 },
  nebula: { label: 'Nebula', pairs: 8 },
  galaxy: { label: 'Galaxy', pairs: 12 },
} as const;
export type Difficulty = keyof typeof DIFFICULTIES;

// Imaginary constellations, drawn locally as SVG rather than fetched images.
export const SIGNS = [
  { name: 'Kite', points: [[50, 12], [80, 42], [50, 75], [20, 42], [50, 12], [50, 90]] },
  { name: 'Crown', points: [[15, 25], [30, 72], [70, 72], [85, 25], [65, 45], [50, 15], [35, 45], [15, 25]] },
  { name: 'Comet', points: [[85, 15], [45, 50], [25, 50], [12, 65], [25, 82], [45, 80], [52, 62], [85, 15]] },
  { name: 'Sail', points: [[50, 12], [18, 65], [82, 65], [50, 12], [50, 85], [20, 85], [80, 85]] },
  { name: 'Arrow', points: [[15, 85], [75, 25], [40, 25], [75, 25], [75, 60]] },
  { name: 'Hourglass', points: [[20, 15], [80, 15], [20, 85], [80, 85], [20, 15]] },
  { name: 'Crescent', points: [[70, 12], [35, 20], [18, 50], [35, 80], [70, 88], [47, 65], [40, 48], [47, 30], [70, 12]] },
  { name: 'Bolt', points: [[58, 10], [22, 55], [48, 55], [40, 90], [80, 42], [55, 42], [58, 10]] },
  { name: 'Fox', points: [[12, 15], [23, 70], [50, 90], [77, 70], [88, 15], [62, 42], [38, 42], [12, 15]] },
  { name: 'Mountain', points: [[10, 80], [38, 20], [58, 60], [70, 35], [90, 80], [10, 80]] },
  { name: 'Heart', points: [[50, 30], [30, 12], [10, 30], [15, 52], [50, 87], [85, 52], [90, 30], [70, 12], [50, 30]] },
  { name: 'Orbit', points: [[50, 12], [80, 25], [90, 50], [80, 75], [50, 88], [20, 75], [10, 50], [20, 25], [50, 12]] },
] as const;

export interface PairCard { id: number; sign: number }
export interface PairGame {
  difficulty: Difficulty;
  cards: PairCard[];
  flipped: number[];
  matched: number[];
  moves: number;
  won: boolean;
}
export interface PersonalBest { moves: number; seconds: number }
export type PersonalBests = Partial<Record<Difficulty, PersonalBest>>;
export const BEST_KEY = 'kk-star-pairs-best-v1';

function shuffle<T>(items: T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createPairGame(difficulty: Difficulty, random = Math.random): PairGame {
  const signs = shuffle(SIGNS.map((_, index) => index), random).slice(0, DIFFICULTIES[difficulty].pairs);
  return {
    difficulty,
    cards: shuffle(signs.flatMap(sign => [sign, sign]), random).map((sign, id) => ({ id, sign })),
    flipped: [], matched: [], moves: 0, won: false,
  };
}

export function flipPairCard(game: PairGame, id: number): PairGame {
  const card = game.cards.find(card => card.id === id);
  if (!card || game.won || game.flipped.length === 2 || game.flipped.includes(id) || game.matched.includes(id)) return game;
  const flipped = [...game.flipped, id];
  if (flipped.length === 1) return { ...game, flipped };
  const first = game.cards.find(card => card.id === flipped[0])!;
  const matched = first.sign === card.sign ? [...game.matched, ...flipped] : game.matched;
  return {
    ...game, moves: game.moves + 1, matched,
    flipped: first.sign === card.sign ? [] : flipped,
    won: matched.length === game.cards.length,
  };
}

export function concealPairCards(game: PairGame): PairGame {
  return game.flipped.length === 2 ? { ...game, flipped: [] } : game;
}

export function isBetterScore(score: PersonalBest, previous?: PersonalBest): boolean {
  return !previous || score.moves < previous.moves || (score.moves === previous.moves && score.seconds < previous.seconds);
}

export function parsePersonalBests(json: string | null): PersonalBests {
  try {
    const data = JSON.parse(json ?? '{}');
    const bests: PersonalBests = {};
    for (const difficulty of Object.keys(DIFFICULTIES) as Difficulty[]) {
      const score = data?.[difficulty];
      if (score && Number.isSafeInteger(score.moves) && score.moves >= DIFFICULTIES[difficulty].pairs &&
          Number.isSafeInteger(score.seconds) && score.seconds >= 0) {
        bests[difficulty] = { moves: score.moves, seconds: score.seconds };
      }
    }
    return bests;
  } catch {
    return {};
  }
}
