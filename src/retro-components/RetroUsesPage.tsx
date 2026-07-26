// Retro (Web 1.0) dressing of /uses: the same list page-components/UsesPage.tsx
// renders, as beveled panels full of bordered tables instead of cards.
//
// The data itself comes from src/data/uses.ts so the two skins can't drift —
// adding an entry there shows up in both. Only the period flavour (the fake
// filename in each window's title bar) lives here, keyed by section title so a
// new section still renders, just with a generic caption.
//
// Rendered server-side with no client:* directive: static HTML only.

import { USES } from '../data/uses';

const WINDOW_FILE: Record<string, string> = {
  Hardware: 'HARDWARE.INI',
  'OS & desktop': 'AUTOEXEC.BAT',
  Development: 'TOOLBOX.EXE',
  'This website': 'THIS_PAGE.HTM',
};

export function RetroUsesPage() {
  return (
    <div className="rt-stack">
      <h1 className="rt-heading">
        <span className="rt-rainbow">MY SETUP!!!</span>
      </h1>

      <div className="rt-panel">
        <div className="rt-panel__title">README.1ST</div>
        <div className="rt-panel__body">
          <p style={{ marginBottom: '6px' }}>
            The hardware, software, and services behind everything here. Part of the{' '}
            <a href="https://uses.tech" target="_blank" rel="noopener noreferrer">
              /uses
            </a>{' '}
            tradition.
          </p>
          <p className="rt-note" style={{ margin: 0 }}>
            &raquo; System specifications page. Every 90s homepage had one. Mine is honest.
          </p>
        </div>
      </div>

      <div className="rt-hr"></div>

      {USES.map(section => (
        <div className="rt-panel" key={section.title}>
          <div className="rt-panel__title">{WINDOW_FILE[section.title] ?? 'README.TXT'}</div>
          <div className="rt-panel__body">
            <h2 className="rt-subhead" style={{ marginTop: 0 }}>
              {section.title}
            </h2>
            <table className="rt-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '38%' }}>
                    Item
                  </th>
                  <th scope="col">What it&rsquo;s for</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map(item => (
                  <tr key={item.name}>
                    <td>
                      {item.href ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer">
                          <strong>{item.name}</strong>
                        </a>
                      ) : (
                        <strong>{item.name}</strong>
                      )}
                    </td>
                    <td>{item.detail ?? <span className="rt-soft">&mdash;</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="rt-hr rt-hr--stars"></div>

      <div className="rt-panel">
        <div className="rt-panel__title rt-panel__title--plain">Also Recommended</div>
        <div className="rt-panel__body rt-center">
          <p style={{ marginBottom: '8px' }}>
            Curious what I&rsquo;m up to with all of it? See <a href="/now">/now</a>.
          </p>
          <p className="rt-row" style={{ justifyContent: 'center', margin: 0 }}>
            <a className="rt-btn" href="/now">
              /now
            </a>
            <a className="rt-btn" href="/portfolio">
              Projects
            </a>
            <a className="rt-btn rt-btn--primary" href="/guestbook">
              Sign my guestbook
            </a>
          </p>
          <p className="rt-note" style={{ margin: '10px 0 0' }}>
            Best viewed at 1024 x 768 with the monitor switched on. ┬─┬ ノ( ゜-゜ノ)
          </p>
        </div>
      </div>
    </div>
  );
}

export default RetroUsesPage;
