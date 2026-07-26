import type { ReactNode } from "react";

/**
 * RETRO CV — "RESUME.DOC", as it would have looked if it had been typed up in
 * 2004 and saved to a floppy. Same data as src/page-components/CvPage.tsx,
 * dressed in the rt-* vocabulary from src/styles/retro.css.
 */

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

interface Props {
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

/**
 * Ported from CvPage.tsx: the CV data really does put "Key: value" prefixes and
 * inline [text](url) markdown links inside item.main, so both have to be parsed
 * out or the page renders raw markdown at the reader.
 */
function renderMain(main: string): ReactNode {
  const colonIndex = main.indexOf(":");
  if (colonIndex > -1 && colonIndex < 50) {
    const key = main.substring(0, colonIndex + 1);
    const rest = main.substring(colonIndex + 1);
    const linkMatch = rest.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      const [full, text, url] = linkMatch;
      const at = linkMatch.index ?? 0;
      const pre = rest.substring(0, at);
      const post = rest.substring(at + full.length);
      return (
        <span>
          <strong>{key}</strong>
          {pre}
          <a href={url}>{text}</a>
          {post}
        </span>
      );
    }
    return (
      <span>
        <strong>{key}</strong>
        {rest}
      </span>
    );
  }
  return <span>{main}</span>;
}

/** Anchor id for a section, so the table of contents can jump to it. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Things still in progress get the obligatory blinking NEW! gif. */
function isFresh(main: string): boolean {
  return /\bpresent\b|\bongoing\b/i.test(main);
}

const NEW_BADGE = (
  <img
    src="/retro/gfx/new.svg"
    alt="New!"
    width={36}
    height={16}
    className="rt-pixel"
    style={{ marginLeft: "6px", border: 0 }}
  />
);

export function RetroCvPage({ personal, sections }: Props) {
  return (
    <>
      <h1 className="rt-heading">
        <span className="rt-rainbow">Curriculum Vitae</span>
      </h1>

      <p className="rt-center rt-note" style={{ marginTop: "-4px" }}>
        (that's Latin for "the whole rigmarole") &nbsp;&nbsp;&#9734;
      </p>

      {/* ============ The document itself ============ */}
      <div className="rt-panel">
        <div className="rt-panel__title">A:\RESUME.DOC &mdash; Microsoft Word 97</div>
        <div className="rt-panel__body">
          <div className="rt-inset rt-mono rt-small" style={{ marginBottom: "10px" }}>
            <span aria-hidden="true">[ File ][ Edit ][ View ][ Insert ][ Format ][ Tools ][ Help ]</span>
            <br />
            <span className="rt-soft">
              Document opened read-only. 1 page. Spell check: 0 errors (I checked twice).
            </span>
          </div>

          <div className="rt-center rt-stack">
            <h2 className="rt-subhead rt-center" style={{ marginTop: 0 }}>
              <span className="rt-glow">{personal.name}</span>
            </h2>
            <p className="rt-alt" style={{ margin: 0 }}>
              {personal.title}
            </p>
          </div>

          <table className="rt-table" style={{ marginTop: "10px" }}>
            <caption className="rt-sr-only">Personal details</caption>
            <tbody>
              <tr>
                <th scope="row" style={{ width: "8.5em" }}>
                  Name
                </th>
                <td>{personal.name}</td>
              </tr>
              <tr>
                <th scope="row">Title</th>
                <td>{personal.title}</td>
              </tr>
              <tr>
                <th scope="row">Location</th>
                <td>{personal.location}</td>
              </tr>
              <tr>
                <th scope="row">E-Mail</th>
                <td>
                  <img
                    src="/retro/gfx/mail.svg"
                    alt=""
                    width={32}
                    height={24}
                    style={{ marginRight: "5px" }}
                  />
                  <a href={`mailto:${personal.email}`}>{personal.email}</a>
                </td>
              </tr>
              <tr>
                <th scope="row">Homepage</th>
                <td>
                  <a href={personal.website}>korikosmos.dev</a>{" "}
                  <span className="rt-note">(you are soaking in it)</span>
                </td>
              </tr>
              <tr>
                <th scope="row">LinkedIn</th>
                <td>
                  <a href={personal.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="rt-row" style={{ marginTop: "12px", justifyContent: "center" }}>
            <a className="rt-btn rt-btn--primary" href="/cv" aria-label="Download my CV (this page)">
              <span aria-hidden="true">&#9660;</span> Download my CV
            </a>
            <a className="rt-btn" href={`mailto:${personal.email}`}>
              <span aria-hidden="true">&#9993;</span> Hire me
            </a>
          </div>
          <p className="rt-center rt-note" style={{ margin: "6px 0 0" }}>
            The button reloads this page, because this page IS the CV. Saves on
            bandwidth. Press Ctrl+P if your printer is feeling brave.
          </p>
        </div>
      </div>

      <div className="rt-hr"></div>

      {/* ============ Contents ============ */}
      <div className="rt-panel">
        <div className="rt-panel__title rt-panel__title--plain">Contents</div>
        <div className="rt-panel__body" style={{ padding: "4px" }}>
          <ul className="rt-nav">
            {sections.map((section) => (
              <li key={section.title}>
                <a href={`#${slugify(section.title)}`}>{section.title}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rt-marquee">
        <div className="rt-marquee__track">
          &#9733; REFERENCES AVAILABLE ON REQUEST &#9733; &nbsp;&nbsp;&nbsp; This
          CV is 100% hand-typed, no template &nbsp;&nbsp;&nbsp; Yes, I really did
          write all of this myself &nbsp;&nbsp;&nbsp; ( &#8226;&#818;&#768;
          &#7501;&#818; &#8226;&#818;&#769; )&#7597; &nbsp;&nbsp;&nbsp;
        </div>
      </div>

      {/* ============ The sections ============ */}
      {sections.map((section) => {
        const slug = slugify(section.title);
        return (
          <div className="rt-panel" key={section.title} id={slug} style={{ marginTop: "14px" }}>
            <div className="rt-panel__title">{slug.toUpperCase().replace(/-/g, "_")}.TXT</div>
            <div className="rt-panel__body">
              <h2 className="rt-subhead" style={{ marginTop: 0 }}>
                {section.title}
              </h2>

              {section.content && (
                <div className="rt-prose">
                  {section.content.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              )}

              {section.items && (
                <ul className="rt-prose">
                  {section.items.map((item, i) => (
                    <li key={i} style={{ marginBottom: "8px" }}>
                      {renderMain(item.main)}
                      {isFresh(item.main) && NEW_BADGE}

                      {item.subItems && (
                        <ul>
                          {item.subItems.map((sub, j) => (
                            <li key={j}>{sub}</li>
                          ))}
                        </ul>
                      )}

                      {item.description && (
                        <p className="rt-note" style={{ margin: "3px 0 0" }}>
                          {item.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}

      <div className="rt-hr rt-hr--stars"></div>

      {/* ============ Period flavour footer ============ */}
      <div className="rt-panel">
        <div className="rt-panel__title">Employer Notes</div>
        <div className="rt-panel__body rt-center rt-stack">
          <p style={{ margin: 0 }}>
            <img src="/retro/gfx/sparkle.svg" alt="" width={14} height={14} className="rt-pixel" />
            <img src="/retro/gfx/sparkle.svg" alt="" width={14} height={14} className="rt-pixel" />
            <img src="/retro/gfx/sparkle.svg" alt="" width={14} height={14} className="rt-pixel" />
          </p>
          <p className="rt-comic" style={{ margin: 0 }}>
            <span className="rt-wobble">Thanks for reading all the way down!</span>
          </p>
          <div className="rt-inset rt-small rt-alt">
            <p style={{ margin: 0 }}>
              This document was typed by hand and has never been near a CV
              template. If it helped, the polite thing to do is{" "}
              <a href="/guestbook">sign the guestbook</a> &mdash; and if you
              actually want to hire me,{" "}
              <a href={`mailto:${personal.email}`}>send an e-mail</a>.
            </p>
          </div>
          <p className="rt-note" style={{ margin: 0 }}>
            <span className="rt-blink">NOTICE:</span> printed copies are not
            guaranteed to fit on one page of A4. Best viewed at 1024 x 768.
          </p>
          <p className="rt-mono rt-small rt-soft" style={{ margin: 0 }} aria-hidden="true">
            -=-=-=-=-=-=- END OF DOCUMENT -=-=-=-=-=-=-
          </p>
        </div>
      </div>
    </>
  );
}

export default RetroCvPage;
