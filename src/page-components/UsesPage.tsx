// The "/uses page" indie-web convention: the hardware, software, and services I use.
// The data lives in src/data/uses.ts because the retro skin renders it too.

import { USES } from '../data/uses';

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
