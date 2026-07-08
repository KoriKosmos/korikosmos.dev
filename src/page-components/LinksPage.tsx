// Ported from https://korikosmos.carrd.co — edit the LINKS data to add or remove entries.

interface LinkItem {
  label: string;
  href: string;
  detail?: string;
}

interface LinkSection {
  title: string;
  items: LinkItem[];
}

const LINKS: LinkSection[] = [
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

const isExternal = (href: string) => href.startsWith('http');

export function LinksPage() {
  return (
    <section className="my-8 space-y-8">
      <header>
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent inline-block">
          Links
        </h1>
        <p className="mt-2 text-base-content/60">Everywhere else you can find me.</p>
      </header>

      {LINKS.map(section => (
        <div key={section.title}>
          <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {section.items.map(item => (
              <li key={item.label}>
                <a
                  href={item.href}
                  {...(isExternal(item.href) ? { target: '_blank', rel: 'me noopener noreferrer' } : {})}
                  className="block bg-base-200 rounded-xl px-5 py-4 shadow hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <span className="font-semibold text-lg">{item.label}</span>
                  {item.detail && <span className="block text-sm text-base-content/60">{item.detail}</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export default LinksPage;
