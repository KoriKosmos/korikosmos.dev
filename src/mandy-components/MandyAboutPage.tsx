// Mandy-mode /about. Same facts as page-components/AboutPage.tsx, in the
// section/card vocabulary from src/styles/mandy.css, plus the interests from
// cv.json (passed in by about.astro) and the four fandoms this skin is themed on.

import { MANDY_THEME_INFO } from './MandyNav';
import { MANDY_THEMES } from '../lib/skin';

export interface MandyAboutPageProps {
  /** cv.json "Interests" content, comma-separated. */
  interests: string[];
}

const PLACES = ['Pakistan', 'Indonesia', 'Wales', 'England'];

export function MandyAboutPage({ interests }: MandyAboutPageProps) {
  const tags = interests.flatMap(line => line.split(',')).map(s => s.trim()).filter(Boolean);

  return (
    <>
      <section className="md-section md-section--first" aria-labelledby="md-about-title">
        <div className="md-section__head">
          <h1 className="md-section__title" id="md-about-title">About me</h1>
          <span className="md-section__tag">player one</span>
        </div>
        <div className="md-section__body">
          <p>
            Hi, I&rsquo;m Maan. I&rsquo;m someone who enjoys <mark className="md-key">thoughtful storytelling</mark>,
            whether it comes from comics, manga, films, or games. I&rsquo;ve always been drawn to creative worlds and
            the ideas behind them &mdash; not just how they&rsquo;re made, but why they resonate with people.
          </p>
          <p>
            I&rsquo;ve lived in <mark className="md-key">several countries</mark>, and that experience has shaped my
            perspective &mdash; I adapt quickly, stay curious, and value open-minded conversations. In my free time, I
            enjoy reading, watching character-driven dramas or animation, and diving into games that offer more than
            just action &mdash; ones that tell a story or challenge the way you think.
          </p>
          <p>
            Outside of entertainment, I like to <mark className="md-key">organise and improve things</mark>. Whether
            that&rsquo;s setting up my home server, building tools, or just refining a small personal project, I find
            satisfaction in making systems work better. I enjoy learning new skills, but I also value quiet time to
            reflect or explore new ideas at my own pace.
          </p>
        </div>
      </section>

      <section className="md-section" aria-labelledby="md-about-places">
        <div className="md-section__head">
          <h2 className="md-section__title" id="md-about-places">Places I&rsquo;ve lived</h2>
          <span className="md-section__tag">the map so far</span>
        </div>
        <ul className="md-tags">
          {PLACES.map(place => (
            <li key={place} className="md-tag">{place}</li>
          ))}
        </ul>
      </section>

      <section className="md-section" aria-labelledby="md-about-interests">
        <div className="md-section__head">
          <h2 className="md-section__title" id="md-about-interests">Interests</h2>
          <span className="md-section__tag">off the clock</span>
        </div>
        <ul className="md-tags">
          {tags.map(tag => (
            <li key={tag} className="md-tag">{tag}</li>
          ))}
        </ul>
        <h3 className="md-subhead">Fandoms</h3>
        <div className="md-grid">
          {MANDY_THEMES.map((name, i) => (
            <div key={name} className={i % 2 ? 'md-card md-card--alt' : 'md-card'}>
              <span className="md-card__title">{MANDY_THEME_INFO[name].blurb}</span>
              <span className="md-card__meta">also a theme: {MANDY_THEME_INFO[name].label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="md-section" aria-labelledby="md-about-contact">
        <div className="md-section__head">
          <h2 className="md-section__title" id="md-about-contact">Get in touch</h2>
          <span className="md-section__tag">say hi</span>
        </div>
        <ul className="md-contact">
          <li>
            <a className="md-contact__link" href="mailto:kori@korikosmos.dev">
              <span className="md-blink" aria-hidden="true"></span>Email <small>kori@korikosmos.dev</small>
            </a>
          </li>
          <li>
            <a
              className="md-contact__link"
              href="https://linkedin.com/in/maan-meher-449094a0"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="md-blink" aria-hidden="true"></span>LinkedIn
            </a>
          </li>
        </ul>
        <p style={{ marginTop: '2rem' }}>
          <a className="md-btn" href="/cv">See: the CV</a>{' '}
          <a className="md-btn md-btn--ghost" href="/now">What I&rsquo;m up to now</a>
        </p>
      </section>
    </>
  );
}

export default MandyAboutPage;
