// Ported from https://korikosmos.carrd.co.
// The data lives in src/data/links.ts because the retro skin renders it too.

import { LINKS, isExternalLink as isExternal } from '../data/links';

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
