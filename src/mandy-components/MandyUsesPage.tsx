// Mandy-mode /uses. The list itself is src/data/uses.ts, shared with the other
// two skins; this file only decides how it looks (one md-section per category,
// one md-card per item, linked when the item has an href).

import { USES } from '../data/uses';

export function MandyUsesPage() {
  return (
    <>
      <section className="md-section md-section--first" aria-labelledby="md-uses-title">
        <div className="md-section__head">
          <h1 className="md-section__title" id="md-uses-title">Uses</h1>
          <span className="md-section__tag">my loadout</span>
        </div>
        <div className="md-section__body">
          <p>
            The hardware, software, and services behind everything here. Part of the{' '}
            <a href="https://uses.tech" target="_blank" rel="noopener noreferrer">/uses</a> tradition.
          </p>
        </div>
      </section>

      {USES.map((section, i) => (
        <section key={section.title} className="md-section" aria-labelledby={`md-uses-s${i}`}>
          <div className="md-section__head">
            <h2 className="md-section__title" id={`md-uses-s${i}`}>{section.title}</h2>
            <span className="md-section__tag">
              {section.items.length} {section.items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="md-grid">
            {section.items.map(item =>
              item.href ? (
                <a
                  key={item.name}
                  className="md-card"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="md-card__title">{item.name}</span>
                  {item.detail && <span className="md-card__desc">{item.detail}</span>}
                </a>
              ) : (
                <div key={item.name} className="md-card md-card--alt">
                  <span className="md-card__title">{item.name}</span>
                  {item.detail && <span className="md-card__desc">{item.detail}</span>}
                </div>
              ),
            )}
          </div>
        </section>
      ))}

      <section className="md-section" aria-label="Related">
        <p className="md-note">
          Curious what I&rsquo;m up to with all of it? See <a href="/now">/now</a>.
        </p>
      </section>
    </>
  );
}

export default MandyUsesPage;
