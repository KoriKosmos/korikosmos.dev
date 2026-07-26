// Ported from https://korikosmos.carrd.co — edit this data to add or remove entries.
//
// Lives here rather than inside LinksPage.tsx because both skins render it:
// LinksPage.tsx (modern) and RetroLinksPage.tsx (Web 1.0). One source of truth,
// so adding a link can't update only one skin.

export interface LinkItem {
  label: string;
  href: string;
  detail?: string;
}

export interface LinkSection {
  title: string;
  items: LinkItem[];
}

export const LINKS: LinkSection[] = [
  {
    title: 'Social',
    items: [
      { label: 'Bluesky', href: 'https://bsky.app/profile/korikosmos.bsky.social' },
      { label: 'Mastodon', href: 'https://urusai.social/@KoriKosmos' },
      { label: 'Misskey', href: 'https://misskey.io/@KoriKosmos' },
      { label: 'Twitter', href: 'https://twitter.com/KoriKosmos' },
      { label: 'Instagram', href: 'https://www.instagram.com/korikosmos/' },
      { label: 'Threads', href: 'https://www.threads.net/@korikosmos' },
    ],
  },
  {
    title: 'Watching, listening, playing',
    items: [
      { label: 'AniList', href: 'https://anilist.co/user/ZaneJulien/', detail: 'anime & manga' },
      { label: 'Letterboxd', href: 'https://letterboxd.com/KoriKosmos/', detail: 'films' },
      { label: 'Last.fm', href: 'https://www.last.fm/user/ZaneJulien', detail: 'music — see /tunes' },
      { label: 'Steam', href: 'https://steamcommunity.com/id/KoriKosmos/', detail: 'games' },
    ],
  },
  {
    title: 'Work & code',
    items: [
      { label: 'GitHub', href: 'https://github.com/KoriKosmos' },
      { label: 'LinkedIn', href: 'https://linkedin.com/in/maan-meher-449094a0' },
      { label: 'Email', href: 'mailto:kori@korikosmos.dev', detail: 'kori@korikosmos.dev' },
    ],
  },
  {
    title: 'This site',
    items: [{ label: 'RSS feed', href: '/rss.xml', detail: 'subscribe to the blog' }],
  },
];

export const isExternalLink = (href: string) => href.startsWith('http');
