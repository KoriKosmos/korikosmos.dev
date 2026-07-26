// The retro front page — a 2004 index.htm that has been added to for years and
// never once reorganised. Content is the same content as the modern homepage
// (plus the About blurb, posts and projects); only the dress is different.
//
// Every class here comes from src/styles/retro.css. Inline styles are used only
// for one-off spacing and for un-bulleting lists that carry their own markers.

interface RetroPost {
  slug: string;
  title: string;
  description: string;
  /** ISO string — Dates don't survive the Astro -> React boundary. */
  pubDate: string;
}

interface RetroProject {
  slug: string;
  title: string;
  summary: string;
}

interface Props {
  posts: RetroPost[];
  projects: RetroProject[];
}

const SITE_MAP: { label: string; href: string; children?: { label: string; href: string }[] }[] = [
  { label: "Home", href: "/" },
  { label: "About Me", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "CV / Resume", href: "/cv" },
  { label: "Tunes (what I'm listening to)", href: "/tunes" },
  { label: "Now", href: "/now" },
  { label: "Uses", href: "/uses" },
  { label: "Links", href: "/links" },
  {
    label: "Games",
    href: "/games",
    children: [
      { label: "Tetris", href: "/games/tetris" },
      { label: "Rock Paper Scissors", href: "/games/rock-paper-scissors" },
    ],
  },
  { label: "Guestbook", href: "/guestbook" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function RetroHomePage({ posts, projects }: Props) {
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
  );
  const newestSlug = sortedPosts[0]?.slug ?? null;

  return (
    <div>
      <h1 className="rt-heading">
        <span className="rt-wobble" aria-hidden="true">✧</span> Welcome to My Home Page{" "}
        <span className="rt-wobble" aria-hidden="true">✧</span>
      </h1>
      <p className="rt-center rt-note" style={{ marginTop: "-4px" }}>
        This page has been under construction since roughly forever. Please excuse the mess.
      </p>

      {/* ============ Welcome ============ */}
      <section className="rt-panel" aria-labelledby="rt-welcome-head">
        <div className="rt-panel__title">Welcome.htm</div>
        <div className="rt-panel__body">
          <h2 className="rt-subhead" id="rt-welcome-head">
            Hi, I&apos;m Maan! <span className="rt-small">(◕‿◕✿)</span>
          </h2>

          <div className="rt-row" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
            <img
              src="/retro/gfx/mascot.svg"
              alt="A small pink cat waving hello"
              width="72"
              height="72"
              className="rt-pixel"
            />
            <div style={{ flex: "1 1 240px", minWidth: "0" }}>
              <p>
                I&apos;m someone who enjoys thoughtful storytelling, whether it comes from comics,
                manga, films, or games. I&apos;ve lived in several countries, and that experience has
                shaped my perspective &mdash; I adapt quickly, stay curious, and value open-minded
                conversations.
              </p>
              <p style={{ marginBottom: 0 }}>
                Outside of entertainment, I like to organise and improve things: setting up my home
                server, building tools, or refining a small personal project. This website is one of
                those projects, and it shows.
              </p>
            </div>
          </div>

          <div className="rt-inset rt-center" style={{ marginTop: "10px" }}>
            <p className="rt-small" style={{ marginBottom: "4px" }}>
              <span className="rt-blink" aria-hidden="true">★</span> You are visitor number{" "}
              <b>&mdash; see the odometer in the sidebar!</b>{" "}
              <span className="rt-blink" aria-hidden="true">★</span>
            </p>
            <p className="rt-note" style={{ margin: 0 }}>
              (the counter is real, which is somehow the most 2003 thing about this whole website)
            </p>
          </div>

          <div className="rt-row" style={{ marginTop: "10px", justifyContent: "center" }}>
            <a className="rt-btn rt-btn--primary" href="/about">
              Read more about me &raquo;
            </a>
            <a className="rt-btn" href="mailto:kori@korikosmos.dev">
              <img src="/retro/gfx/mail.svg" alt="" width="32" height="24" /> E-mail me
            </a>
            <a
              className="rt-btn"
              href="https://linkedin.com/in/maan-meher-449094a0"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>

          {/* A panel inside a panel, because of course. */}
          <div className="rt-panel" style={{ marginTop: "12px", marginBottom: 0 }}>
            <div className="rt-panel__title rt-panel__title--plain">Site Statistics</div>
            <div className="rt-panel__body">
              <table className="rt-table">
                <caption className="rt-sr-only">Counts of things published on this site</caption>
                <tbody>
                  <tr>
                    <th scope="row">Blog posts written</th>
                    <td className="rt-mono">{posts.length}</td>
                  </tr>
                  <tr>
                    <th scope="row">Projects shipped</th>
                    <td className="rt-mono">{projects.length}</td>
                  </tr>
                  <tr>
                    <th scope="row">Playable games</th>
                    <td className="rt-mono">2</td>
                  </tr>
                  <tr>
                    <th scope="row">Frames used</th>
                    <td className="rt-mono">0 (I was tempted)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <div className="rt-hr"></div>

      {/* ============ What's New ============ */}
      <section className="rt-panel" aria-labelledby="rt-news-head">
        <div className="rt-panel__title">WHATSNEW.TXT</div>
        <div className="rt-panel__body">
          <h2 className="rt-subhead" id="rt-news-head">
            <span className="rt-glow">What&apos;s New</span>
          </h2>
          <p className="rt-note" style={{ marginTop: "-2px" }}>
            Newest first. I update this whenever I remember that I have a website.
          </p>

          {sortedPosts.length === 0 ? (
            <div className="rt-inset rt-center">
              <p style={{ margin: 0 }}>
                Nothing here yet! Check back soon. <span className="rt-small">(´･ω･`)</span>
              </p>
            </div>
          ) : (
            <ul className="rt-stack" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {sortedPosts.map((post) => (
                <li key={post.slug} className="rt-inset">
                  <p style={{ margin: 0 }}>
                    <span className="rt-mono rt-small rt-soft">[{formatDate(post.pubDate)}]</span>{" "}
                    <a href={`/blog/${post.slug}/`}>
                      <b>{post.title}</b>
                    </a>{" "}
                    {post.slug === newestSlug && (
                      <img
                        src="/retro/gfx/new.svg"
                        alt="New!"
                        width="36"
                        height="16"
                        className="rt-pixel"
                      />
                    )}
                  </p>
                  <p className="rt-small rt-alt" style={{ margin: "3px 0 0" }}>
                    {post.description}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <p className="rt-center" style={{ margin: "12px 0 0" }}>
            <a className="rt-btn" href="/blog">
              All blog posts &raquo;
            </a>{" "}
            <a className="rt-btn" href="/rss.xml">
              RSS feed
            </a>
          </p>
        </div>
      </section>

      <div className="rt-hr rt-hr--stars"></div>

      {/* ============ Projects ============ */}
      <section className="rt-panel" aria-labelledby="rt-projects-head">
        <div className="rt-panel__title">My Projects</div>
        <div className="rt-panel__body">
          <h2 className="rt-subhead" id="rt-projects-head">
            Things I Have Made
          </h2>
          <p className="rt-note" style={{ marginTop: "-2px" }}>
            Click a box. Every box goes somewhere. That is the deal we have.
          </p>

          {projects.length === 0 ? (
            <div className="rt-inset rt-center">
              <p style={{ margin: 0 }}>No projects listed yet &mdash; they&apos;re all in a folder called <span className="rt-mono">final_v2_REAL</span>.</p>
            </div>
          ) : (
            <ul className="rt-cardgrid">
              {projects.map((project) => (
                <li key={project.slug}>
                  <a className="rt-card" href={`/portfolio/${project.slug}/`}>
                    <span className="rt-card__title" style={{ display: "block" }}>
                      {project.title}
                    </span>
                    <span className="rt-small" style={{ display: "block" }}>
                      {project.summary}
                    </span>
                    <span className="rt-card__meta" style={{ display: "block", marginTop: "5px" }}>
                      /portfolio/{project.slug}/
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <p className="rt-center" style={{ margin: "12px 0 0" }}>
            <a className="rt-btn rt-btn--primary" href="/portfolio">
              Visit the full portfolio &raquo;
            </a>
          </p>
        </div>
      </section>

      <div className="rt-hr"></div>

      {/* ============ Site map ============ */}
      <section className="rt-panel" aria-labelledby="rt-sitemap-head">
        <div className="rt-panel__title">Site Map</div>
        <div className="rt-panel__body">
          <h2 className="rt-subhead" id="rt-sitemap-head">
            Every Page On This Site
          </h2>
          <p className="rt-note" style={{ marginTop: "-2px" }}>
            No search box. Nobody had a search box. You just read the list.
          </p>

          <div className="rt-inset">
            <ul>
              {SITE_MAP.map((entry) => (
                <li key={entry.href}>
                  <a href={entry.href}>{entry.label}</a>
                  {entry.children && entry.children.length > 0 && (
                    <ul>
                      {entry.children.map((child) => (
                        <li key={child.href}>
                          <a href={child.href}>{child.label}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <p className="rt-note" style={{ margin: 0 }}>
              Also available: a whole other version of this website with rounded corners and
              restraint. The switcher is in the bottom-left corner.
            </p>
          </div>
        </div>
      </section>

      <div className="rt-hr rt-hr--hearts"></div>

      {/* ============ Guestbook CTA ============ */}
      <section className="rt-panel" aria-labelledby="rt-guestbook-head">
        <div className="rt-panel__title">Guestbook</div>
        <div className="rt-panel__body rt-center">
          <h2 className="rt-subhead" id="rt-guestbook-head" style={{ textAlign: "center" }}>
            <span className="rt-rainbow">Sign my guestbook!</span>
          </h2>

          <img
            className="rt-blinkie"
            src="/retro/blinkies/guestbook.svg"
            alt="Please sign my guestbook"
            width="150"
            height="20"
          />

          <p style={{ margin: "8px 0" }}>
            Say hello, leave a compliment about my table layout, or tell me what you&apos;re
            listening to. All entries are read by a real human (me).
          </p>

          <div className="rt-row" style={{ justifyContent: "center" }}>
            <a className="rt-btn rt-btn--primary" href="/guestbook">
              ✍ Sign the guestbook
            </a>
            <a href="/guestbook" title="Sign my guestbook">
              <img
                className="rt-btn88"
                src="/retro/buttons/guestbook.svg"
                alt="Sign my guestbook (88 by 31 button)"
                width="88"
                height="31"
              />
            </a>
          </div>

          <p className="rt-note" style={{ margin: "10px 0 0" }}>
            ASCII guarantee: &nbsp;<span className="rt-mono">*~*~*~ thank you for visiting ~*~*~*</span>
          </p>
        </div>
      </section>

      <div className="rt-hr"></div>

      {/* ============ Fake system message ============ */}
      <section className="rt-panel" aria-labelledby="rt-notice-head">
        <div className="rt-panel__title">System Message</div>
        <div className="rt-panel__body">
          <h2 className="rt-sr-only" id="rt-notice-head">
            Notices
          </h2>
          <div className="rt-inset rt-mono rt-small">
            <p style={{ margin: 0 }}>C:\WEB\KORIKOSMOS&gt; dir /w</p>
            <p style={{ margin: 0 }}>
              INDEX.HTM &nbsp; ABOUT.HTM &nbsp; BLOG\ &nbsp; PORTFOLIO\ &nbsp; GAMES\ &nbsp;
              GUESTBOOK.HTM
            </p>
            <p style={{ margin: 0 }}>6 file(s) &mdash; 100% hand-typed, 0% frames</p>
            <p style={{ margin: 0 }}>
              C:\WEB\KORIKOSMOS&gt; <span className="rt-blink">_</span>
            </p>
          </div>
          <p className="rt-note" style={{ margin: "8px 0 0" }}>
            This site looks best at 1024&times;768 in Netscape Navigator, but works fine in whatever
            you&apos;re using. Thanks for stopping by! ★彡
          </p>
        </div>
      </section>
    </div>
  );
}

export default RetroHomePage;
