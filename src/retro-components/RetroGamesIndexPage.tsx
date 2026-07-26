// Retro skin for /games. Same two games and the same descriptions as
// page-components/GamesIndexPage.tsx, presented as a shareware download
// directory circa 1999: a file listing, FREEWARE stamps, invented file sizes,
// and big "DOWNLOAD" buttons that are, of course, just links.
//
// .rt-card sits on the <li> rather than an <a> so the card can contain its own
// links (nested anchors are invalid HTML).

interface GameEntry {
  href: string;
  title: string;
  /** Verbatim from the modern page. */
  description: string;
  file: string;
  size: string;
  version: string;
  released: string;
  requires: string;
  /** 88x31 button in public/retro/buttons/, if one exists for this game. */
  button?: { src: string; alt: string };
  extras: string[];
}

const GAMES: GameEntry[] = [
  {
    href: '/games/tetris/',
    title: 'Tetris',
    description: 'The classic block-stacking puzzle game.',
    file: 'TETRIS.HTM',
    size: '42 KB',
    version: '1.0',
    released: '1984 (this port: much later)',
    requires: 'a keyboard, arrow keys, patience',
    button: { src: '/retro/buttons/tetris.svg', alt: 'Block stacker' },
    extras: ['High score table', 'Arrow-key controls', 'Zero installers'],
  },
  {
    href: '/games/rock-paper-scissors/',
    title: 'Rock Paper Scissors',
    description: 'Challenge the CPU in this timeless hand game.',
    file: 'RPS.HTM',
    size: '18 KB',
    version: '1.0',
    released: 'prehistory',
    requires: 'one mouse, one hand',
    extras: ['CPU opponent', 'Score keeping', 'Undefeated bragging rights'],
  },
];

export function RetroGamesIndexPage() {
  return (
    <div className="rt-stack">
      <h1 className="rt-heading">
        <span className="rt-glow">Games Directory</span>
      </h1>

      <p className="rt-center rt-alt rt-small" style={{ margin: '0 0 4px' }}>
        <span className="rt-blink">&#9658;</span> {GAMES.length} FILES FOUND{' '}
        <span className="rt-blink">&#9668;</span>
        <br />
        <span className="rt-soft">All titles FREEWARE. No shareware nag screens. No CD key.</span>
      </p>

      <div className="rt-hr" />

      {/* ---- The file listing ---- */}
      <div className="rt-panel">
        <div className="rt-panel__title">C:\WEB\KORIKOSMOS\GAMES\ &mdash; DIR</div>
        <div className="rt-panel__body">
          <table className="rt-table">
            <thead>
              <tr>
                <th scope="col">Filename</th>
                <th scope="col">Size</th>
                <th scope="col">Ver</th>
                <th scope="col">Licence</th>
              </tr>
            </thead>
            <tbody>
              {GAMES.map(game => (
                <tr key={game.file}>
                  <td className="rt-mono">
                    <a href={game.href}>{game.file}</a>
                  </td>
                  <td className="rt-mono">{game.size}</td>
                  <td className="rt-mono">{game.version}</td>
                  <td>FREEWARE</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="rt-note" style={{ margin: '8px 0 0' }}>
            2 file(s) &mdash; 60 KB &nbsp;&middot;&nbsp; 0 director(ies) &nbsp;&middot;&nbsp;
            2,147,483,647 bytes free
          </p>
        </div>
      </div>

      {/* ---- The games themselves ---- */}
      <div className="rt-panel">
        <div className="rt-panel__title">Downloads</div>
        <div className="rt-panel__body">
          <h2 className="rt-subhead" style={{ marginTop: 0 }}>
            Pick a title
          </h2>

          <ul className="rt-cardgrid">
            {GAMES.map(game => (
              <li className="rt-card" key={game.href}>
                <h3 className="rt-card__title">
                  <a href={game.href}>{game.title}</a>
                </h3>
                <p className="rt-card__meta" style={{ marginBottom: '6px' }}>
                  {game.file} &middot; {game.size} &middot; FREEWARE
                </p>

                {game.button ? (
                  <img
                    className="rt-btn88"
                    src={game.button.src}
                    alt={`${game.title} 88 by 31 pixel web button`}
                    width="88"
                    height="31"
                    style={{ marginBottom: '6px' }}
                  />
                ) : (
                  <div
                    className="rt-inset rt-mono rt-small"
                    style={{ marginBottom: '6px', textAlign: 'center' }}
                  >
                    [ no screenshot available ]
                  </div>
                )}

                <p style={{ marginBottom: '6px' }}>{game.description}</p>

                <ul className="rt-small" style={{ marginBottom: '6px' }}>
                  {game.extras.map(extra => (
                    <li key={extra}>{extra}</li>
                  ))}
                </ul>

                <p className="rt-card__meta" style={{ marginBottom: '4px' }}>
                  Released: {game.released}
                  <br />
                  Requires: {game.requires}
                </p>

                <p style={{ margin: '8px 0 0' }}>
                  <a
                    className="rt-btn rt-btn--primary"
                    href={game.href}
                    aria-label={`Download ${game.title} — plays in your browser`}
                  >
                    &#9660; DOWNLOAD
                  </a>{' '}
                  <span className="rt-note">(runs in your browser)</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rt-hr rt-hr--stars" />

      {/* ---- Flavour footer ---- */}
      <div className="rt-panel">
        <div className="rt-panel__title rt-panel__title--plain">System Requirements</div>
        <div className="rt-panel__body">
          <div className="rt-inset rt-mono rt-small">
            <p style={{ margin: 0 }}>CPU &nbsp;&nbsp;: 486DX/66 or better</p>
            <p style={{ margin: 0 }}>RAM &nbsp;&nbsp;: 8 MB (16 MB recommended)</p>
            <p style={{ margin: 0 }}>VIDEO : SVGA, 256 colours</p>
            <p style={{ margin: 0 }}>SOUND : optional, there isn&rsquo;t any</p>
            <p style={{ margin: 0 }}>DISK &nbsp;: 0 bytes &mdash; nothing to install</p>
          </div>
          <p className="rt-note" style={{ margin: '8px 0 0' }}>
            Beat a high score?{' '}
            <a href="/guestbook">Brag about it in the guestbook</a>. Scores are saved to the
            leaderboard automatically &mdash; no floppy disk required.
          </p>
        </div>
      </div>

      <p className="rt-center rt-small rt-soft" style={{ margin: 0 }}>
        <span aria-hidden="true">&#9608;&#9608;&#9608;&#9608;&#9608;&#9617;&#9617;&#9617;&#9617;&#9617; </span>
        Thank you for downloading. Please tell a friend!
      </p>
    </div>
  );
}

export default RetroGamesIndexPage;
