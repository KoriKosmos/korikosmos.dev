// Mandy-mode front page. Mirrors the shape of amandata.dev's index — wordmark
// hero with a sleeping mascot, typewriter tagline, hub buttons, then About |
// Projects, the record (stats + toolkit), Blog | Contact and a changelog — but
// everything in it is Maan's: his bio, his projects, and a Fandoms section in
// the slot where hers has research.
//
// Every class here comes from src/styles/mandy.css. Inline styles are for
// one-off positioning only (the mascot hangs instead of sitting).
//
// The behaviour hooks are MandyEffects' (rendered by the shell): the tagline's
// [data-md-typewriter], the stat [data-md-count]s, and mark.md-key sweeps,
// which only fire for marks inside a <p> inside a .md-section.

import type { CSSProperties, ReactElement } from 'react';
import { LINKS, isExternalLink } from '../data/links';
import { MANDY_THEME_INFO } from './MandyNav';

interface MandyHomePost {
  slug: string;
  title: string;
  description: string;
  /** ISO string — Dates don't survive the Astro -> React boundary. */
  pubDate: string;
}

interface MandyHomeProject {
  slug: string;
  title: string;
  summary: string;
}

interface CvSkillItem {
  main: string;
}

export interface MandyHomePageProps {
  posts: MandyHomePost[];
  projects: MandyHomeProject[];
  /** cv.json's "Technical Skills" items, e.g. "Languages: Java, Python, ...". */
  skills: CvSkillItem[];
}

/* ---------------------------------------------------------------------------
   Pixel art. Each sprite is rows of characters; a key maps a character to a
   class (the mascot, so mandy.css can recolour it per theme) or to a fill.
   Runs of the same character become one rect.
--------------------------------------------------------------------------- */
type PixelKey = Record<string, { className?: string; fill?: string }>;

function pixelRects(rows: string[], key: PixelKey) {
  const rects: ReactElement[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      const paint = key[ch];
      if (!paint) { x++; continue; }
      let w = 0;
      while (row[x + w] === ch) w++;
      rects.push(
        <rect
          key={`${x}-${y}`}
          className={paint.className}
          style={paint.fill ? { fill: paint.fill } : undefined}
          x={x}
          y={y}
          width={w}
          height={1}
        />,
      );
      x += w;
    }
  });
  return rects;
}

function PixelIcon({ rows, palette, size = 30 }: { rows: string[]; palette: PixelKey; size?: number }) {
  const w = rows[0].length;
  const h = rows.length;
  return (
    <svg
      className="md-card__icon"
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={Math.round((size * h) / w)}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {pixelRects(rows, palette)}
    </svg>
  );
}

/* The mascot: a bat, hanging upside down by its feet and asleep, wings folded.
   Feet are the top row, ears the bottom. f fur / w wing / e closed eye / a ear. */
const BAT_ROWS = [
  '....f....f....',
  '....ff..ff....',
  '...wffffffw...',
  '..wwffffffww..',
  '.wwwffffffwww.',
  '.wwwffffffwww.',
  '.wwwffffffwww.',
  '..wwffffffww..',
  '..wwffffffww..',
  '...wffffffw...',
  '...ffffffff...',
  '...feeffeef...',
  '...ffffffff...',
  '....ffffff....',
  '...aa....aa...',
  '...a......a...',
];
const BAT_KEY: PixelKey = { f: { className: 'mf' }, w: { className: 'mw' }, e: { className: 'me' }, a: { className: 'ma' } };

/* The mascot hangs from .md-hero__perch rather than sitting on it, so it is
   anchored by `top` (mandy.css anchors by `bottom`), breathes from its feet,
   and its zs drift up from beside its head rather than above the letters. */
const MASCOT_STYLE: CSSProperties = { bottom: 'auto', top: '74%', left: '64%', width: 'clamp(40px, 6vw, 56px)' };
const MASCOT_SVG_STYLE: CSSProperties = { transformOrigin: '50% 0' };
const Z_STYLES: CSSProperties[] = [
  { left: '96%', bottom: '12%' },
  { left: '110%', bottom: '22%' },
  { left: '86%', bottom: '4%' },
];

/* Fandom icons. Each one is drawn here, not borrowed. */
const ICON_BAT = [
  'X...XX...X',
  'XX.XXXX.XX',
  'XXXXXXXXXX',
  '.XXXXXXXX.',
  '..X.XX.X..',
];
const ICON_TEAR = [
  '...X...',
  '...X...',
  '..XXX..',
  '.XXXXX.',
  'XHXXXXX',
  'XHXXXXX',
  'XXXXXXX',
  '.XXXXX.',
  '..XXX..',
];
const ICON_BALL = [
  '..RRRR..',
  '.RRRRRR.',
  'RRRRRRRR',
  'KKKWWKKK',
  'WWWWWWWW',
  'WWWWWWWW',
  '.WWWWWW.',
  '..WWWW..',
];
const ICON_POW = [
  'X...X...X',
  '.X.XXX.X.',
  '..XXXXX..',
  '.XXXOXXX.',
  'XXXOOOXXX',
  '.XXXOXXX.',
  '..XXXXX..',
  '.X.XXX.X.',
  'X...X...X',
];

interface Fandom {
  name: string;
  note: string;
  theme: keyof typeof MANDY_THEME_INFO;
  icon: ReactElement;
}

const FANDOMS: Fandom[] = [
  {
    name: 'Batman',
    note: "The world's greatest detective: rainy rooftops, a bat-signal, and the best rogues' gallery in comics.",
    theme: 'gotham',
    icon: <PixelIcon rows={ICON_BAT} palette={{ X: { fill: 'var(--md-accent)' } }} />,
  },
  {
    name: 'The Binding of Isaac',
    note: 'One more run, always. Basements, tears, and item synergies that break the game in the best way.',
    theme: 'basement',
    icon: (
      <PixelIcon
        rows={ICON_TEAR}
        size={22}
        palette={{ X: { fill: 'var(--md-accent-2)' }, H: { fill: 'var(--md-ink)' } }}
      />
    ),
  },
  {
    name: 'Pokémon',
    note: 'Enough of a fan that it became a project: a Pokédex classifier that recognises species across art styles.',
    theme: 'kanto',
    icon: (
      <PixelIcon
        rows={ICON_BALL}
        size={26}
        palette={{ R: { fill: '#D7261E' }, W: { fill: '#F4F4F4' }, K: { fill: '#1E2230' } }}
      />
    ),
  },
  {
    name: 'Comics',
    note: 'Comics and manga are where a lot of my design thinking comes from: panels, pacing, a good splash page.',
    theme: 'inkwell',
    icon: (
      <PixelIcon rows={ICON_POW} palette={{ X: { fill: 'var(--md-accent)' }, O: { fill: 'var(--md-bg)' } }} />
    ),
  },
];

const HUBS = [
  { href: '/about', label: 'About me' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/blog', label: 'Blog' },
  { href: '/games', label: 'Games' },
];

/* Hand-written from the repo history; newest first. */
const CHANGELOG: { when: string; what: string }[] = [
  { when: 'Oct 2026', what: 'Mandy mode lands: a third skin, inspired by amandata.dev, with a theme for each fandom.' },
  { when: 'Sep 2026', what: 'Star Pairs, a constellation memory game, joins Tetris and Rock Paper Scissors.' },
  { when: 'Sep 2026', what: 'Blog reading tools, plus shareable search for the blog and portfolio.' },
  { when: 'Aug 2026', what: 'The theme now renders server-side, so it can never flash the default.' },
  { when: 'Aug 2026', what: 'Constellation social cards for every post and project.' },
  { when: 'Jul 2026', what: 'Webcore mode: the whole site as a 2004 home page, guestbook included.' },
];

/* From cv.json's summary: Pakistan, Indonesia, Wales, England. */
const COUNTRIES_LIVED = 4;
/* Star Pairs, Tetris, Rock Paper Scissors. */
const GAMES_ON_SITE = 3;

const CONTACT_LABELS = ['Email', 'GitHub', 'LinkedIn', 'Bluesky'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function splitSkill(main: string): { label: string; value: string } {
  const i = main.indexOf(':');
  return i > -1 ? { label: main.slice(0, i), value: main.slice(i + 1).trim() } : { label: '', value: main };
}

export function MandyHomePage({ posts, projects, skills }: MandyHomePageProps) {
  const latest = [...posts]
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 2);
  const allLinks = LINKS.flatMap(section => section.items);
  const contacts = CONTACT_LABELS.map(label => allLinks.find(item => item.label === label)).filter(
    (item): item is NonNullable<typeof item> => Boolean(item),
  );
  const toolkit = skills.map(item => splitSkill(item.main));
  const languageCount = toolkit.find(s => s.label === 'Languages')?.value.split(',').length ?? 0;

  const stats = [
    { n: COUNTRIES_LIVED, label: 'countries lived in' },
    { n: posts.length, label: 'blog posts written' },
    { n: projects.length, label: 'projects on the portfolio' },
    { n: GAMES_ON_SITE, label: 'games you can play here' },
    { n: languageCount, label: 'programming languages on the CV' },
    { n: Object.keys(MANDY_THEME_INFO).length, label: 'fandom themes in this skin' },
  ];

  return (
    <>
      {/* ================= HERO ================= */}
      <header className="md-hero" id="top">
        <div className="md-ribbons" aria-hidden="true"></div>
        <h1 className="md-hero__title" style={{ marginBottom: '3.6rem' }}>
          kori<span className="md-hero__accent">kosmos</span>
          <span className="md-hero__perch">
            .dev
            <span className="md-mascot" style={MASCOT_STYLE} aria-hidden="true">
              <svg
                viewBox="0 0 14 16"
                shapeRendering="crispEdges"
                style={MASCOT_SVG_STYLE}
                aria-hidden="true"
                focusable="false"
              >
                {pixelRects(BAT_ROWS, BAT_KEY)}
              </svg>
              {Z_STYLES.map((style, i) => (
                <span key={i} className="md-mascot__z" style={style}>
                  z
                </span>
              ))}
            </span>
          </span>
        </h1>
        <p className="md-hero__tagline">
          <span data-md-typewriter>
            CS grad, comic reader, basement crawler, Pokémon trainer. Welcome to my corner.
          </span>
          <span className="md-caret" aria-hidden="true"></span>
        </p>
        <nav className="md-hero__hubs" aria-label="Main sections">
          {HUBS.map(hub => (
            <a key={hub.href} className="md-hero__hub" href={hub.href}>
              {hub.label}
            </a>
          ))}
        </nav>
        <p className="md-hero__scroll">
          Scroll <span aria-hidden="true">↓</span>
        </p>
      </header>

      {/* ================= ABOUT + PROJECTS ================= */}
      <div className="md-cols">
        <section className="md-section" id="about" aria-labelledby="md-about-title">
          <div className="md-section__head">
            <h2 className="md-section__title" id="md-about-title">About me</h2>
            <span className="md-section__tag">player one</span>
          </div>
          <div className="md-section__body">
            <p>
              Hi, I&rsquo;m Maan, a <mark className="md-key">Computer Science</mark> graduate who enjoys thoughtful
              storytelling, whether it comes from comics, manga, films, or games. I&rsquo;m drawn to creative worlds
              and the ideas behind them: not just how they&rsquo;re made, but why they resonate.
            </p>
            <p>
              I&rsquo;ve lived in <mark className="md-key">four countries</mark>, which taught me to adapt quickly and
              stay curious. Outside of entertainment, I like to organise and improve things: my{' '}
              <mark className="md-key">home server</mark>, small tools, and this website.
            </p>
            <p>
              <a href="/about">More about me &rarr;</a>
            </p>
          </div>
        </section>

        <section className="md-section" id="work" aria-labelledby="md-work-title">
          <div className="md-section__head">
            <h2 className="md-section__title" id="md-work-title">Projects</h2>
            <span className="md-section__tag">things I&rsquo;ve built</span>
          </div>
          <div className="md-section__body">
            {projects.length === 0 ? (
              <p className="md-note">Nothing listed yet. Check back soon.</p>
            ) : (
              <div className="md-grid">
                {projects.map(project => (
                  <a key={project.slug} className="md-card" href={`/portfolio/${project.slug}`}>
                    <span className="md-card__title">{project.title}</span>
                    <span className="md-card__desc">{project.summary}</span>
                  </a>
                ))}
              </div>
            )}
            <p style={{ marginTop: '1rem' }}>
              <a href="/portfolio">the full portfolio &rarr;</a>
            </p>
          </div>
        </section>
      </div>

      {/* ================= FANDOMS ================= */}
      <section className="md-section" id="fandoms" aria-labelledby="md-fandoms-title">
        <div className="md-section__head">
          <h2 className="md-section__title" id="md-fandoms-title">Fandoms</h2>
          <span className="md-section__tag">what I&rsquo;m into</span>
        </div>
        <div className="md-section__body">
          <p>
            Four worlds I keep coming back to. Each one is also a look for this page: open{' '}
            <mark className="md-key">Change Theme</mark> in the top bar and pick{' '}
            {FANDOMS.map((f, i) => (
              <span key={f.theme}>
                <strong>{MANDY_THEME_INFO[f.theme].label}</strong>
                {i < FANDOMS.length - 2 ? ', ' : i === FANDOMS.length - 2 ? ' or ' : ''}
              </span>
            ))}
            . The scene behind the page changes with it.
          </p>
        </div>
        <div className="md-grid">
          {FANDOMS.map((f, i) => (
            <div key={f.theme} className={i % 2 ? 'md-card md-card--alt' : 'md-card'}>
              {f.icon}
              <span className="md-card__title">{f.name}</span>
              <span className="md-card__desc">{f.note}</span>
              <span className="md-card__meta">theme: {MANDY_THEME_INFO[f.theme].label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= THE RECORD ================= */}
      <section className="md-section" id="record" aria-labelledby="md-record-title">
        <div className="md-section__head">
          <h2 className="md-section__title" id="md-record-title">By the numbers</h2>
          <span className="md-section__tag">the record</span>
        </div>
        <div className="md-stats" role="list">
          {stats.map(stat => (
            <div key={stat.label} className="md-stat" role="listitem">
              <span className="md-stat__num" data-md-count={stat.n}>
                {stat.n}
              </span>
              <span className="md-stat__label">{stat.label}</span>
            </div>
          ))}
        </div>
        <h3 className="md-subhead">Toolkit</h3>
        <div className="md-skills">
          {toolkit.map(skill => (
            <div key={skill.label || skill.value}>
              {skill.label && <h4>{skill.label}</h4>}
              <p>{skill.value}</p>
            </div>
          ))}
        </div>
        <p className="md-center" style={{ marginTop: '2.4rem' }}>
          <a className="md-btn" href="/cv">
            See: the full CV
          </a>
        </p>
      </section>

      {/* ================= BLOG + CONTACT ================= */}
      <div className="md-cols">
        <section className="md-section" id="blog-preview" aria-labelledby="md-blog-title">
          <div className="md-section__head">
            <h2 className="md-section__title" id="md-blog-title">Blog</h2>
            <span className="md-section__tag">notes &amp; write-ups</span>
          </div>
          <div className="md-section__body">
            {latest.length === 0 ? (
              <p>
                No posts yet, <a href="/blog">visit the blog</a>.
              </p>
            ) : (
              <div className="md-posts">
                {latest.map(post => (
                  <a key={post.slug} className="md-post" href={`/blog/${post.slug}`}>
                    <span className="md-post__title">{post.title}</span>
                    <span className="md-post__date">
                      <time dateTime={post.pubDate.slice(0, 10)}>{formatDate(post.pubDate)}</time>
                    </span>
                    <span className="md-post__desc">{post.description}</span>
                  </a>
                ))}
              </div>
            )}
            <p style={{ marginTop: '1rem' }}>
              <a href="/blog">all posts &rarr;</a>
            </p>
          </div>
        </section>

        <section className="md-section" id="contact" aria-labelledby="md-contact-title">
          <div className="md-section__head">
            <h2 className="md-section__title" id="md-contact-title">Contact</h2>
            <span className="md-section__tag">say hi</span>
          </div>
          <ul className="md-contact">
            {contacts.map(item => (
              <li key={item.label}>
                <a
                  className="md-contact__link"
                  href={item.href}
                  {...(isExternalLink(item.href) ? { target: '_blank', rel: 'me noopener noreferrer' } : {})}
                >
                  <span className="md-blink" aria-hidden="true"></span>
                  {item.label}
                  {item.detail && <small>{item.detail}</small>}
                </a>
              </li>
            ))}
          </ul>
          <p className="md-note" style={{ marginTop: '1.2rem' }}>
            More places to find me on the <a href="/links">links page</a>.
          </p>
        </section>
      </div>

      {/* ================= CHANGELOG ================= */}
      <section className="md-section" id="changelog" aria-labelledby="md-changelog-title">
        <div className="md-section__head">
          <h2 className="md-section__title" id="md-changelog-title">Changelog</h2>
          <span className="md-section__tag">site updates</span>
        </div>
        <div className="md-section__body">
          <ul className="md-list">
            {CHANGELOG.map(entry => (
              <li key={entry.what}>
                <span className="md-micro" style={{ color: 'var(--md-tag)' }}>{entry.when}</span> &middot; {entry.what}
              </li>
            ))}
          </ul>
          <p>
            Full history in the{' '}
            <a href="https://github.com/KoriKosmos/korikosmos.dev/commits/main" target="_blank" rel="noopener noreferrer">
              repo&rsquo;s commit log
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}

export default MandyHomePage;
