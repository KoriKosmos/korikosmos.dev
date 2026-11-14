// Title and description for every fixed page, keyed by route.
//
// Shared by the pages themselves (each passes its entry to <Layout>) and by the
// social-card endpoint (src/pages/og/[...route].ts), so a page's link preview
// always says what the page says. Blog posts and projects aren't listed: their
// cards come from their content collection entries.
//
// The homepage has no `title`: Layout shows the bare site name there.

export interface PageMeta {
  title?: string;
  description: string;
}

export const PAGE_META = {
  '/': { description: 'Personal portfolio, blog, and games hub by Maan.' },
  '/about': { title: 'About', description: 'About Maan -- storytelling enthusiast, systems thinker, and lifelong learner.' },
  '/now': { title: 'Now', description: 'What Maan is focused on right now — projects, music, and more.' },
  '/uses': { title: 'Uses', description: 'The hardware, software, and services Maan uses day to day.' },
  '/links': { title: 'Links', description: 'Everywhere else you can find KoriKosmos — socials, media trackers, and code.' },
  '/guestbook': { title: 'Guestbook', description: "Sign Maan's guestbook — the good part of the old web." },
  '/portfolio': { title: 'Portfolio', description: 'Projects and work by Maan.' },
  '/cv': { title: 'CV', description: 'CV and professional background of Maan.' },
  '/blog': { title: 'Blog', description: 'Blog posts by Maan on tech, creativity, and personal projects.' },
  '/tunes': { title: 'Tunes', description: "What I'm listening to right now, powered by Last.fm scrobbles." },
  '/games': { title: 'Games', description: 'Play Tetris, Rock Paper Scissors, and more browser games.' },
  '/games/tetris': { title: 'Tetris', description: 'Play Tetris in your browser with leaderboard support.' },
  '/games/star-pairs': {
    title: 'Star Pairs',
    description: 'A constellation memory game. Match the stars, explore three board sizes, and beat your personal best.',
  },
  '/games/rock-paper-scissors': {
    title: 'Rock Paper Scissors',
    description: 'Challenge the CPU in Rock Paper Scissors with a global leaderboard.',
  },
} as const satisfies Record<string, PageMeta>;

export type PagePath = keyof typeof PAGE_META;

const SITE_CARD = '/og/site.png';

/** `/games/tetris` → `page/games/tetris`, the card's key under /og/. */
export const pageCardKey = (path: string) => `page${path}`;

/**
 * The social card for a request path when the page didn't pass its own: the
 * page's card if it's one of the fixed pages above, otherwise the site card
 * (the homepage, the 404 page, anything unlisted).
 */
export function ogImageFor(pathname: string): string {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (path === '/' || !Object.hasOwn(PAGE_META, path)) return SITE_CARD;
  return `/og/${pageCardKey(path)}.png`;
}
