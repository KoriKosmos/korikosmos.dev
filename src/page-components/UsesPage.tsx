// The "/uses page" indie-web convention: the hardware, software, and services I use.
// Edit the USES data below to keep it honest — see https://uses.tech for the wider directory.

interface UsesItem {
  name: string;
  detail?: string;
  href?: string;
}

interface UsesSection {
  title: string;
  items: UsesItem[];
}

const USES: UsesSection[] = [
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

export function UsesPage() {
  return (
    <section className="my-8 space-y-8">
      <header>
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent inline-block">
          Uses
        </h1>
        <p className="mt-2 text-base-content/60">
          The hardware, software, and services behind everything here. Part of the{' '}
          <a href="https://uses.tech" target="_blank" rel="noopener noreferrer" className="link link-primary">
            /uses
          </a>{' '}
          tradition.
        </p>
      </header>

      {USES.map(section => (
        <div key={section.title} className="bg-base-200 rounded-xl p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
          <ul className="space-y-3">
            {section.items.map(item => (
              <li key={item.name} className="text-lg">
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary font-semibold"
                  >
                    {item.name}
                  </a>
                ) : (
                  <span className="font-semibold">{item.name}</span>
                )}
                {item.detail && <span className="text-base-content/70"> — {item.detail}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <p className="text-base-content/60">
        Curious what I'm up to with all of it? See <a href="/now" className="link link-primary">/now</a>.
      </p>
    </section>
  );
}

export default UsesPage;
