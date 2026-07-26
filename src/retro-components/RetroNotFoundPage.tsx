// Retro skin for the 404 route. Same job as page-components/NotFoundPage.tsx
// ("the page you're looking for doesn't exist" + a way home), dressed as a
// 2003 error page: a fake dialog, a deliberately broken image, an eternal
// under-construction gif, and — underneath the bit — an actually useful
// directory of every real section of the site.

interface Destination {
  href: string;
  label: string;
  detail: string;
}

const DESTINATIONS: Destination[] = [
  { href: '/', label: 'Home', detail: 'the front page, safe and warm' },
  { href: '/about', label: 'About', detail: 'who is running this thing' },
  { href: '/blog', label: 'Blog', detail: 'words, posted occasionally' },
  { href: '/portfolio', label: 'Portfolio', detail: 'projects that actually exist' },
  { href: '/cv', label: 'CV', detail: 'the employable version of me' },
  { href: '/tunes', label: 'Tunes', detail: 'what I have been listening to' },
  { href: '/games', label: 'Games', detail: 'Tetris and Rock Paper Scissors' },
  { href: '/now', label: 'Now', detail: 'what I am up to lately' },
  { href: '/uses', label: 'Uses', detail: 'the gear and the software' },
  { href: '/links', label: 'Links', detail: 'everywhere else you can find me' },
  { href: '/guestbook', label: 'Guestbook', detail: 'say hello, 1998-style' },
];

export function RetroNotFoundPage() {
  return (
    <div className="rt-stack">
      <h1 className="rt-heading" style={{ fontSize: '4em', marginBottom: 0 }}>
        <span className="rt-rainbow">404</span>
      </h1>

      <p className="rt-center rt-alt" style={{ margin: '0 0 4px' }}>
        <span className="rt-blink">FILE NOT FOUND</span>
      </p>

      <p className="rt-center rt-small rt-soft" style={{ margin: 0 }}>
        The page you&rsquo;re looking for doesn&rsquo;t exist.
      </p>

      <div className="rt-hr" />

      {/* ---- The fake dialog ---- */}
      <div className="rt-panel">
        <div className="rt-panel__title">Netscape &mdash; [Error]</div>
        <div className="rt-panel__body">
          <div className="rt-inset rt-mono rt-small">
            <p style={{ margin: 0 }}>&gt; HTTP/1.0 404 Not Found</p>
            <p style={{ margin: 0 }}>&gt; The requested URL was not found on this server.</p>
            <p style={{ margin: 0 }}>&gt; It has moved, been deleted, or never existed at all.</p>
            <p style={{ margin: 0 }}>&gt; Reason code: 0x1998 (PAGE_UNDER_CONSTRUCTION_FOREVER)</p>
          </div>

          <p style={{ margin: '10px 0 0' }}>
            Sorry about this! Pages on a hand-made website move around. If you followed a link from
            somewhere else, it may be pointing at an old address.
          </p>

          <div className="rt-row" style={{ justifyContent: 'center', marginTop: '10px' }}>
            <a className="rt-btn rt-btn--primary" href="/">
              Take me home
            </a>
            <a className="rt-btn" href="/blog">
              Read the blog
            </a>
            <a className="rt-btn" href="/guestbook">
              Report a dead link
            </a>
          </div>
        </div>
      </div>

      {/* ---- The broken image bit ---- */}
      <div className="rt-panel">
        <div className="rt-panel__title">Missing Asset</div>
        <div className="rt-panel__body rt-center">
          <div
            className="rt-inset rt-mono rt-small"
            style={{
              display: 'inline-block',
              minWidth: '210px',
              textAlign: 'left',
              borderStyle: 'dashed',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: '1.4em', marginRight: '6px' }}>
              &#9634;&#10005;
            </span>
            page_you_wanted.gif
          </div>
          <p className="rt-note" style={{ margin: '6px 0 0' }}>
            (That broken image is on purpose. Everything else being broken is not.)
          </p>

          <img
            className="rt-construction"
            src="/retro/gfx/construction.svg"
            alt="Under construction"
            width="180"
            height="60"
          />
          <p className="rt-small" style={{ margin: 0 }}>
            <span className="rt-wobble">This part of the site has been under construction since 2004.</span>
          </p>
        </div>
      </div>

      <div className="rt-hr rt-hr--stars" />

      {/* ---- The genuinely helpful part ---- */}
      <div className="rt-panel">
        <div className="rt-panel__title">Site Directory &mdash; try one of these</div>
        <div className="rt-panel__body">
          <h2 className="rt-subhead" style={{ marginTop: 0 }}>
            Everything that does exist
          </h2>
          <table className="rt-table">
            <thead>
              <tr>
                <th scope="col">Page</th>
                <th scope="col">What&rsquo;s there</th>
              </tr>
            </thead>
            <tbody>
              {DESTINATIONS.map(destination => (
                <tr key={destination.href}>
                  <td>
                    <a href={destination.href}>{destination.label}</a>
                  </td>
                  <td className="rt-soft">{destination.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="rt-note" style={{ margin: '8px 0 0' }}>
            Still stuck? Email{' '}
            <a href="mailto:kori@korikosmos.dev">kori@korikosmos.dev</a> and I will dig the page out
            of the archive.
          </p>
        </div>
      </div>

      <p className="rt-center rt-small rt-soft" style={{ margin: 0 }}>
        <span aria-hidden="true">&#9583;&#9633;&#9531;&#9633;&#65289;&#9583; </span>
        Error handled. Have a nice day!
      </p>
    </div>
  );
}

export default RetroNotFoundPage;
