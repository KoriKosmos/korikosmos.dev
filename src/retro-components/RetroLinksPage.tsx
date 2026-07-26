// Retro skin for /links: the same list page-components/LinksPage.tsx renders,
// re-dressed as a 2003 "MY LINKS" page — one beveled panel per section, a
// directory table inside each, and a "link to me" button-swap panel at the end.
//
// The data comes from src/data/links.ts so the two skins can't drift; adding a
// link there shows up in both. Only period flavour lives here — the fake window
// caption and blurb per section, and which entries get a blinking NEW! badge —
// keyed by title/label so unknown entries still render, just without flavour.
//
// Vocabulary is retro.css only (rt-*); one-off spacing is inline styles.

import { LINKS, isExternalLink as isExternal } from '../data/links';

const SECTION_FLAVOUR: Record<string, { window: string; blurb: string }> = {
  Social: {
    window: 'SOCIAL.HTM',
    blurb: 'Where I post. Mostly nonsense, occasionally a screenshot.',
  },
  'Watching, listening, playing': {
    window: 'MEDIA.HTM',
    blurb: 'Automated proof of how I spend my evenings.',
  },
  'Work & code': {
    window: 'SERIOUS.HTM',
    blurb: 'The tie-wearing links. Please do not judge me by the others.',
  },
  'This site': {
    window: 'HOMEPAGE.HTM',
    blurb: 'Push-button subscribing! No newsletter, no algorithm, no cookies*.',
  },
};

const NEW_LINKS = new Set(['Bluesky', 'RSS feed']);

const LINK_SNIPPET = [
  '<a href="https://korikosmos.dev">',
  '  <img src="https://korikosmos.dev/retro/buttons/korikosmos.svg"',
  '       alt="KoriKosmos.dev" width="88" height="31" border="0">',
  '</a>',
].join('\n');

const totalLinks = LINKS.reduce((count, section) => count + section.items.length, 0);

export function RetroLinksPage() {
  return (
    <div className="rt-stack">
      <h1 className="rt-heading">
        <span className="rt-rainbow">My Links</span>
      </h1>

      <p className="rt-center rt-alt rt-small" style={{ margin: '0 0 4px' }}>
        Everywhere else you can find me.{' '}
        <span aria-hidden="true">(ノ◕ヮ◕)ノ*:･ﾟ✧</span>
      </p>

      <div className="rt-hr rt-hr--hearts" />

      <div className="rt-panel">
        <div className="rt-panel__title">Read Me First</div>
        <div className="rt-panel__body">
          <div className="rt-inset rt-mono rt-small">
            <p style={{ margin: 0 }}>
              &gt; DIR /LINKS &nbsp;&mdash;&nbsp; {totalLinks} entries found, {LINKS.length} folders.
            </p>
            <p style={{ margin: 0 }}>
              &gt; All links verified by hand. If one rots,{' '}
              <a href="/guestbook">tell me in the guestbook</a>.
            </p>
          </div>
          <p className="rt-note" style={{ margin: '8px 0 0' }}>
            Links marked{' '}
            <img
              className="rt-pixel"
              src="/retro/gfx/new.svg"
              alt="NEW!"
              width="36"
              height="16"
              style={{ verticalAlign: 'text-bottom' }}
            />{' '}
            are recent additions. Off-site links open in a new window, as was the custom.
          </p>
        </div>
      </div>

      {LINKS.map(section => {
        // Social has no detail strings at all — a column of em dashes is noise
        // on screen and six announcements of "em dash" off it. Drop the column.
        const hasDetails = section.items.some(item => item.detail);
        const flavour = SECTION_FLAVOUR[section.title];
        return (
        <div className="rt-panel" key={section.title}>
          <div className="rt-panel__title">{flavour?.window ?? 'LINKS.HTM'}</div>
          <div className="rt-panel__body">
            <h2 className="rt-subhead" style={{ marginTop: 0 }}>
              {section.title}
            </h2>
            {flavour && (
              <p className="rt-small rt-soft" style={{ marginBottom: '8px' }}>
                {flavour.blurb}
              </p>
            )}

            <table className="rt-table">
              <thead>
                <tr>
                  <th scope="col">Site</th>
                  {hasDetails && <th scope="col">What&rsquo;s there</th>}
                </tr>
              </thead>
              <tbody>
                {section.items.map(item => (
                  <tr key={item.label}>
                    <td>
                      <a
                        href={item.href}
                        {...(isExternal(item.href)
                          ? { target: '_blank', rel: 'me noopener noreferrer' }
                          : {})}
                      >
                        {item.label}
                      </a>
                      {isExternal(item.href) && (
                        <>
                          {' '}
                          <span aria-hidden="true" className="rt-small">
                            &#8599;
                          </span>
                          <span className="rt-sr-only">(opens in a new window)</span>
                        </>
                      )}
                      {NEW_LINKS.has(item.label) && (
                        <>
                          {' '}
                          <img
                            className="rt-pixel"
                            src="/retro/gfx/new.svg"
                            alt="NEW!"
                            width="36"
                            height="16"
                            style={{ verticalAlign: 'text-bottom' }}
                          />
                        </>
                      )}
                    </td>
                    {hasDetails && <td className="rt-soft">{item.detail ?? ''}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        );
      })}

      <div className="rt-hr" />

      {/* ---- Link to me! ---- */}
      <div className="rt-panel">
        <div className="rt-panel__title">Link To Me!</div>
        <div className="rt-panel__body">
          <h2 className="rt-subhead" style={{ marginTop: 0 }}>
            Take a button, leave a button
          </h2>

          <p className="rt-small">
            Got a homepage? Stick me on it. Please save the image to your own server instead of
            hotlinking &mdash; my bandwidth is precious and finite (it is not).
          </p>

          <div className="rt-row" style={{ justifyContent: 'center', margin: '10px 0' }}>
            <a href="https://korikosmos.dev" title="KoriKosmos.dev">
              <img
                className="rt-btn88"
                src="/retro/buttons/korikosmos.svg"
                alt="KoriKosmos.dev 88 by 31 pixel web button"
                width="88"
                height="31"
              />
            </a>
            <span className="rt-mono rt-small rt-soft">88 &times; 31 &middot; SVG &middot; 1 KB</span>
          </div>

          <p className="rt-label" style={{ marginBottom: '4px' }}>
            Copy this HTML:
          </p>
          <div className="rt-inset" style={{ overflowX: 'auto' }}>
            <pre style={{ margin: 0 }}>{LINK_SNIPPET}</pre>
          </div>

          <p className="rt-note" style={{ margin: '8px 0 0' }}>
            Linked me already? <a href="/guestbook">Sign the guestbook</a> and I will come and look
            at your site. That is a promise.
          </p>
        </div>
      </div>

      <p className="rt-center rt-note" style={{ margin: 0 }}>
        <span className="rt-blink">*</span> Fine, one cookie. It remembers which skin you picked.
      </p>
    </div>
  );
}

export default RetroLinksPage;
