import type { ReactElement } from 'react';

/**
 * The games index in Mandy mode: an md-grid of cards for the three games, each
 * with a tiny inline pixel icon. Same games, links and descriptions as
 * GamesIndexPage.tsx. Purely presentational (no client JS).
 */

/**
 * Pixel icon from a character grid, one <rect> per horizontal run. Letters map
 * to theme tokens, so every icon recolours with the Mandy sub-theme.
 */
const INK: Record<string, string> = {
  a: 'var(--md-accent)',
  b: 'var(--md-accent-2)',
  c: 'var(--md-ink)',
};

function PixelIcon({ rows }: { rows: string[] }) {
  const rects: ReactElement[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (!INK[ch]) { x++; continue; }
      let w = 0;
      while (row[x + w] === ch) w++;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={w} height={1} style={{ fill: INK[ch] }} />);
      x += w;
    }
  });
  return (
    <svg
      className="md-card__icon"
      viewBox={`0 0 ${rows[0].length} ${rows.length}`}
      width={rows[0].length * 4}
      height={rows.length * 4}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {rects}
    </svg>
  );
}

// 10x10 grids. Purely decorative.
const ICONS = {
  // two linked stars
  stars: [
    '..a.......',
    '.aaa......',
    'aaaaa.....',
    '.a.a.c....',
    '......c...',
    '.......b..',
    '......bbb.',
    '.....bbbbb',
    '......b.b.',
    '..........',
  ],
  // a T-piece landing on a stack
  tetris: [
    '...aaa....',
    '....a.....',
    '..........',
    '..........',
    '........bb',
    '........bb',
    'cc....bbbb',
    'cc.cccbbbb',
    'cccccccbbb',
    'cccccccccc',
  ],
  // an open pair of scissors
  rps: [
    'c.......c.',
    '.c.....c..',
    '..c...c...',
    '...c.c....',
    '....c.....',
    '...a.a....',
    '..a...a...',
    '.a.a.a.a..',
    '.a.a.a.a..',
    '..a...a...',
  ],
};

interface Game {
  href: string;
  title: string;
  /** Verbatim from the modern page. */
  description: string;
  meta: string;
  icon: keyof typeof ICONS;
}

const GAMES: Game[] = [
  {
    href: '/games/star-pairs/',
    title: 'Star Pairs',
    description: 'Match the constellations in a cosmic memory game.',
    meta: 'three board sizes · personal bests',
    icon: 'stars',
  },
  {
    href: '/games/tetris/',
    title: 'Tetris',
    description: 'The classic block-stacking puzzle game.',
    meta: 'arrow keys · global high scores',
    icon: 'tetris',
  },
  {
    href: '/games/rock-paper-scissors/',
    title: 'Rock Paper Scissors',
    description: 'Challenge the CPU in this timeless hand game.',
    meta: 'vs the CPU · global leaderboard',
    icon: 'rps',
  },
];

export function MandyGamesIndexPage() {
  return (
    <>
      <section className="md-section md-section--first">
        <div className="md-section__head">
          <h1 className="md-section__title">Games</h1>
          <span className="md-section__tag">// press start</span>
        </div>
        <div className="md-section__body">
          <p>
            Three small browser games, no installs, no loot boxes. Pick one and see if you can
            get your name on a leaderboard.
          </p>
        </div>
        <ul className="md-grid">
          {GAMES.map((game, index) => (
            <li key={game.href}>
              <a className={index % 2 ? 'md-card md-card--alt' : 'md-card'} href={game.href} style={{ height: '100%' }}>
                <PixelIcon rows={ICONS[game.icon]} />
                <span className="md-card__title">{game.title}</span>
                <span className="md-card__desc">{game.description}</span>
                <span className="md-card__meta">{game.meta}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="md-section">
        <div className="md-section__head">
          <h2 className="md-section__title">Meanwhile, in the background</h2>
          <span className="md-section__tag">// a fourth game</span>
        </div>
        <div className="md-section__body">
          <p>
            The scene behind this page is playing itself, and it changes with the theme. In{' '}
            <mark className="md-key">Gotham</mark> the Bat-Signal sweeps the skyline; in the{' '}
            <mark className="md-key">Basement</mark> a crying kid clears a cellar one tear at a
            time; in <mark className="md-key">Kanto</mark> a trainer wanders the tall grass; and{' '}
            <mark className="md-key">Inkwell</mark> is all POW! and THWIP!
          </p>
          <p className="md-note">
            Switch with the theme button in the nav. No, you can't play it. Yes, I tried.
          </p>
        </div>
      </section>
    </>
  );
}

export default MandyGamesIndexPage;
