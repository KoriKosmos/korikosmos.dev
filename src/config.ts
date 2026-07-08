export const SITE_TITLE = 'KoriKosmos';
export const SITE_DESCRIPTION = 'Personal portfolio and blog.';

// Navigation: top-level links and categorised dropdowns.
// The brand wordmark in the header links home; it isn't part of this list.
export interface NavLink {
  href: string;
  label: string;
}

export interface NavGroup {
  label: string;
  items: NavLink[];
}

export type NavItem = NavLink | NavGroup;

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Me',
    items: [
      { href: '/about', label: 'About' },
      { href: '/now', label: 'Now' },
      { href: '/uses', label: 'Uses' },
      { href: '/links', label: 'Links' },
    ],
  },
  {
    label: 'Work',
    items: [
      { href: '/portfolio', label: 'Portfolio' },
      { href: '/cv', label: 'CV' },
    ],
  },
  { href: '/blog', label: 'Blog' },
  { href: '/tunes', label: 'Tunes' },
  {
    label: 'Play',
    items: [
      { href: '/games', label: 'Games' },
      { href: '/games/tetris', label: 'Tetris' },
      { href: '/games/rock-paper-scissors', label: 'Rock Paper Scissors' },
    ],
  },
];
