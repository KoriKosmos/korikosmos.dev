// Mandy-mode 404. Same job as page-components/NotFoundPage.tsx ("this page
// doesn't exist" + a way home), dressed as a Binding of Isaac room with
// nothing in it: no enemies, no pickups, every door still open. Under the bit,
// a real list of rooms that do exist.

interface Room {
  href: string;
  label: string;
  detail: string;
}

const ROOMS: Room[] = [
  { href: '/', label: 'Start room', detail: 'the front page' },
  { href: '/about', label: 'About', detail: 'who runs this place' },
  { href: '/blog', label: 'Blog', detail: 'notes and write-ups' },
  { href: '/portfolio', label: 'Portfolio', detail: 'things I have built' },
  { href: '/games', label: 'Games', detail: 'Star Pairs, Tetris, Rock Paper Scissors' },
  { href: '/tunes', label: 'Tunes', detail: 'what I have been listening to' },
  { href: '/now', label: 'Now', detail: 'what I am up to lately' },
  { href: '/links', label: 'Links', detail: 'everywhere else to find me' },
];

/* An empty cellar from above: wall ring, a door gap in each wall, a few floor
   stones. 26x16 pixel units; colours come from the theme tokens. */
function EmptyRoom() {
  const wall = { fill: 'var(--md-accent-2)' };
  const floor = { fill: 'var(--md-panel)' };
  const stone = { fill: 'var(--md-line)' };
  const door = { fill: 'var(--md-bg)' };
  return (
    <svg
      viewBox="0 0 26 16"
      width="208"
      height="128"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', margin: '0 auto 1.6rem', maxWidth: '100%', height: 'auto' }}
    >
      <rect x="0" y="0" width="26" height="16" style={wall} />
      <rect x="2" y="2" width="22" height="12" style={floor} />
      {/* doors: top, bottom, left, right */}
      <rect x="11" y="0" width="4" height="2" style={door} />
      <rect x="11" y="14" width="4" height="2" style={door} />
      <rect x="0" y="6" width="2" height="4" style={door} />
      <rect x="24" y="6" width="2" height="4" style={door} />
      {/* floor stones */}
      <rect x="5" y="4" width="2" height="1" style={stone} />
      <rect x="18" y="5" width="1" height="1" style={stone} />
      <rect x="7" y="11" width="1" height="1" style={stone} />
      <rect x="16" y="10" width="3" height="1" style={stone} />
      {/* one lonely tear on the floor */}
      <rect x="12" y="7" width="2" height="2" style={{ fill: 'var(--md-accent)' }} />
    </svg>
  );
}

export function MandyNotFoundPage() {
  return (
    <>
      <section className="md-section md-section--first" aria-labelledby="md-404-title">
        <div className="md-section__head">
          <h1 className="md-section__title" id="md-404-title">404: this room is empty</h1>
          <span className="md-section__tag">no items here</span>
        </div>
        <EmptyRoom />
        <div className="md-section__body md-center">
          <p>
            You walked through a door that leads nowhere. No enemies, no pickups, not even a penny. The page
            you&rsquo;re looking for doesn&rsquo;t exist.
          </p>
          <p>
            If a link sent you here, it may point at an old address. Every door below goes somewhere real.
          </p>
        </div>
        <p className="md-center">
          <a className="md-btn" href="/">Back to the start room</a>{' '}
          <a className="md-btn md-btn--ghost" href="/blog">Read the blog</a>
        </p>
      </section>

      <section className="md-section" aria-labelledby="md-404-rooms">
        <div className="md-section__head">
          <h2 className="md-section__title" id="md-404-rooms">Rooms that do exist</h2>
          <span className="md-section__tag">the map</span>
        </div>
        <div className="md-grid">
          {ROOMS.map((room, i) => (
            <a key={room.href} className={i % 2 ? 'md-card md-card--alt' : 'md-card'} href={room.href}>
              <span className="md-card__title">{room.label}</span>
              <span className="md-card__desc">{room.detail}</span>
            </a>
          ))}
        </div>
        <p className="md-note" style={{ marginTop: '1.6rem' }}>
          Still stuck? Email <a href="mailto:kori@korikosmos.dev">kori@korikosmos.dev</a> and I&rsquo;ll dig the page
          out of the basement.
        </p>
      </section>
    </>
  );
}

export default MandyNotFoundPage;
