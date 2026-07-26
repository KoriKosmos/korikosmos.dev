// The "/uses page" data — see https://uses.tech for the wider directory.
//
// Lives here rather than inside UsesPage.tsx because both skins render it:
// UsesPage.tsx (modern) and RetroUsesPage.tsx (Web 1.0). One source of truth,
// so editing the list can't update only one skin.

export interface UsesItem {
  name: string;
  detail?: string;
  href?: string;
}

export interface UsesSection {
  title: string;
  items: UsesItem[];
}

export const USES: UsesSection[] = [
  {
    title: 'Hardware',
    items: [
      { name: 'Main desktop', detail: 'daily driver for dev work and games' },
      { name: 'Home server', detail: 'self-hosted services and experiments' },
    ],
  },
  {
    title: 'OS & desktop',
    items: [
      { name: 'CachyOS', detail: 'Arch-based Linux, tuned kernel', href: 'https://cachyos.org' },
      { name: 'fish', detail: 'shell with sane defaults out of the box', href: 'https://fishshell.com' },
    ],
  },
  {
    title: 'Development',
    items: [
      { name: 'VS Code', detail: 'main editor', href: 'https://code.visualstudio.com' },
      { name: 'Claude Code', detail: 'AI pair programmer in the terminal', href: 'https://claude.com/claude-code' },
      { name: 'Git + GitHub', detail: 'where this site lives', href: 'https://github.com/KoriKosmos' },
      { name: 'Docker', detail: 'this site ships as a multi-stage image' },
    ],
  },
  {
    title: 'This website',
    items: [
      { name: 'Astro 5', detail: 'SSR routing and content collections', href: 'https://astro.build' },
      { name: 'React 19', detail: 'islands for anything interactive', href: 'https://react.dev' },
      { name: 'Tailwind CSS + DaisyUI', detail: 'styling and the four themes', href: 'https://daisyui.com' },
      { name: 'Last.fm', detail: 'powers the Tunes page', href: 'https://www.last.fm' },
    ],
  },
];
