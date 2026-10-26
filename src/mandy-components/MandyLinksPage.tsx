// Mandy-mode /links. The list is src/data/links.ts, shared with the other two
// skins; each section renders as the homepage's contact list (blinking square
// on hover), so the two pages read as one family.

import { LINKS, isExternalLink as isExternal } from '../data/links';

export function MandyLinksPage() {
  return (
    <>
      <section className="md-section md-section--first" aria-labelledby="md-links-title">
        <div className="md-section__head">
          <h1 className="md-section__title" id="md-links-title">Links</h1>
          <span className="md-section__tag">find me elsewhere</span>
        </div>
        <div className="md-section__body">
          <p>Everywhere else you can find me.</p>
        </div>
      </section>

      {LINKS.map((section, i) => (
        <section key={section.title} className="md-section" aria-labelledby={`md-links-s${i}`}>
          <div className="md-section__head">
            <h2 className="md-section__title" id={`md-links-s${i}`}>{section.title}</h2>
          </div>
          <ul className="md-contact">
            {section.items.map(item => (
              <li key={item.label}>
                <a
                  className="md-contact__link"
                  href={item.href}
                  {...(isExternal(item.href) ? { target: '_blank', rel: 'me noopener noreferrer' } : {})}
                >
                  <span className="md-blink" aria-hidden="true"></span>
                  {item.label}
                  {item.detail && <small>{item.detail}</small>}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

export default MandyLinksPage;
