// Mandy-mode /cv. Renders every section of src/data/cv.json (passed in by
// cv.astro, same props as page-components/CvPage.tsx) with the mandy.css
// vocabulary: dated items become md-entry cards, "Label: values" lists become
// an md-skills grid, and the free-text interests become tags.

import type { ReactNode } from 'react';

interface CvItem {
  main: string;
  subItems?: string[];
  description?: string;
}

interface CvSectionData {
  title: string;
  content?: string[];
  items?: CvItem[];
}

export interface MandyCvPageProps {
  personal: {
    name: string;
    title: string;
    location: string;
    email: string;
    website: string;
    linkedin: string;
  };
  sections: CvSectionData[];
}

/** The VT323 tag beside each section title; unknown sections just go without. */
const SECTION_TAGS: Record<string, string> = {
  Summary: 'tl;dr',
  Education: 'school days',
  'Technical Skills': 'toolkit',
  'Key Modules': 'what I studied',
  Projects: 'things I built',
  'Work Experience': 'day jobs',
  Languages: 'spoken',
  Interests: 'off the clock',
};

/** Sections whose items are "Label: a, b, c" and read best as a skills grid. */
const SKILL_SECTIONS = new Set(['Technical Skills', 'Languages']);

/** "2021–2025: ..." / "Jun 2025 – Present: ..." — a leading date range. */
const DATE_PREFIX = /^(\d{4}|[A-Z][a-z]{2} \d{4})/;

/** Inline [text](url) Markdown links, as used in cv.json's portfolio entry. */
function withLinks(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[(.*?)\]\((.*?)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.push(text.slice(last, m.index));
    out.push(<a key={m.index} href={m[2]}>{m[1]}</a>);
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

function splitMain(main: string): { head: string; rest: string } | null {
  const i = main.indexOf(':');
  return i > -1 && i < 50 ? { head: main.slice(0, i), rest: main.slice(i + 1).trim() } : null;
}

function Entry({ item }: { item: CvItem }) {
  const split = splitMain(item.main);
  const dated = split && DATE_PREFIX.test(split.head);
  return (
    <div className="md-entry">
      {dated ? (
        <>
          <div className="md-entry__meta"><span>{split.head}</span></div>
          <p className="md-entry__title">{withLinks(split.rest)}</p>
        </>
      ) : split ? (
        <>
          <p className="md-entry__title">{split.head}</p>
          <p>{withLinks(split.rest)}</p>
        </>
      ) : (
        <p className="md-entry__title">{withLinks(item.main)}</p>
      )}
      {item.description && <p className="md-note">{item.description}</p>}
      {item.subItems && (
        <ul className="md-list">
          {item.subItems.map(sub => <li key={sub}>{sub}</li>)}
        </ul>
      )}
    </div>
  );
}

function SectionBody({ section }: { section: CvSectionData }) {
  if (section.title === 'Interests' && section.content) {
    const tags = section.content.flatMap(line => line.split(',')).map(s => s.trim()).filter(Boolean);
    return (
      <ul className="md-tags">
        {tags.map(tag => <li key={tag} className="md-tag">{tag}</li>)}
      </ul>
    );
  }
  return (
    <>
      {section.content && (
        <div className="md-section__body">
          {section.content.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}
      {section.items && SKILL_SECTIONS.has(section.title) && (
        <div className="md-skills">
          {section.items.map(item => {
            const split = splitMain(item.main);
            return (
              <div key={item.main}>
                {split ? <><h3>{split.head}</h3><p>{split.rest}</p></> : <p>{item.main}</p>}
              </div>
            );
          })}
        </div>
      )}
      {section.items && !SKILL_SECTIONS.has(section.title) && (
        <div>
          {section.items.map(item => <Entry key={item.main} item={item} />)}
        </div>
      )}
    </>
  );
}

export function MandyCvPage({ personal, sections }: MandyCvPageProps) {
  return (
    <>
      <section className="md-section md-section--first" aria-labelledby="md-cv-title">
        <div className="md-section__head">
          <h1 className="md-section__title" id="md-cv-title">{personal.name}</h1>
          <span className="md-section__tag">{personal.title}</span>
        </div>
        <div className="md-section__body">
          <p className="md-micro" style={{ color: 'var(--md-dim)' }}>{personal.location}</p>
        </div>
        <ul className="md-contact">
          <li>
            <a className="md-contact__link" href={`mailto:${personal.email}`}>
              <span className="md-blink" aria-hidden="true"></span>Email <small>{personal.email}</small>
            </a>
          </li>
          <li>
            <a className="md-contact__link" href={personal.website}>
              <span className="md-blink" aria-hidden="true"></span>Website <small>korikosmos.dev</small>
            </a>
          </li>
          <li>
            <a className="md-contact__link" href={personal.linkedin} target="_blank" rel="noopener noreferrer">
              <span className="md-blink" aria-hidden="true"></span>LinkedIn
            </a>
          </li>
        </ul>
      </section>

      {sections.map((section, i) => (
        <section key={section.title} className="md-section" aria-labelledby={`md-cv-s${i}`}>
          <div className="md-section__head">
            <h2 className="md-section__title" id={`md-cv-s${i}`}>{section.title}</h2>
            {SECTION_TAGS[section.title] && <span className="md-section__tag">{SECTION_TAGS[section.title]}</span>}
          </div>
          <SectionBody section={section} />
        </section>
      ))}
    </>
  );
}

export default MandyCvPage;
