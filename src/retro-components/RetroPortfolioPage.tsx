import type { CollectionEntry } from "astro:content";

interface Props {
  projects: CollectionEntry<"projects">[];
}

/**
 * The Web 1.0 portfolio: a "projects directory" of beveled cards plus a fake
 * DOS file listing of the same entries. Every project in the collection is
 * rendered — the STATUS / SIZE columns are period decoration, the titles,
 * summaries and links are the real thing.
 */

/** DOS 8.3-ish filename, for the fake directory listing only. */
function dosName(slug: string): string {
  const stem = slug.replace(/[^a-z0-9-]/gi, "").slice(0, 8).toUpperCase();
  return `${stem || "PROJECT"}.HTM`;
}

/** Stable, entirely made-up file size derived from the real text lengths. */
function fakeSize(project: CollectionEntry<"projects">): string {
  const bytes = 1024 + (project.data.title.length + project.data.summary.length) * 137;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/** Decorative status. "Complete" = the source is public, nothing deeper. */
function status(project: CollectionEntry<"projects">): { label: string; bar: string } {
  return project.data.github
    ? { label: "COMPLETE", bar: "▓▓▓▓▓▓▓▓▓▓ 100%" }
    : { label: "OFFLINE ARCHIVE", bar: "▓▓▓▓▓▓░░░░ 60%" };
}

export function RetroPortfolioPage({ projects }: Props) {
  return (
    <>
      <h1 className="rt-heading">
        <span className="rt-wobble" aria-hidden="true">
          ✎
        </span>{" "}
        My Projects{" "}
        <span className="rt-wobble" aria-hidden="true">
          ✎
        </span>
      </h1>

      <div className="rt-panel">
        <div className="rt-panel__title">C:\WEB\KORIKOSMOS\PROJECTS</div>
        <div className="rt-panel__body">
          <p className="rt-alt rt-small" style={{ marginBottom: "8px" }}>
            Welcome to my projects directory!! Everything below is something I
            actually built. Click a box to read the whole story. If a project has
            its source online there is a big shiny link waiting for you inside.
            <span
              className="rt-blink"
              aria-hidden="true"
              style={{ marginLeft: "6px" }}
            >
              ★
            </span>
          </p>

          <div className="rt-inset rt-center rt-mono rt-small">
            {projects.length} project(s) on file &nbsp;•&nbsp; sorted by vibes
            &nbsp;•&nbsp; 0 bytes free
          </div>

          <div className="rt-hr" />

          <h2 className="rt-subhead">The Projects</h2>

          <ul className="rt-cardgrid">
            {projects.map((project, index) => {
              const state = status(project);
              return (
                <li key={project.slug}>
                  <a className="rt-card" href={`/portfolio/${project.slug}/`}>
                    <h3 className="rt-card__title">
                      {project.data.title}
                      {index === 0 && (
                        <img
                          src="/retro/gfx/new.svg"
                          alt="NEW!"
                          width={36}
                          height={16}
                          className="rt-pixel"
                          style={{ marginLeft: "5px" }}
                        />
                      )}
                    </h3>
                    <p style={{ margin: "0 0 6px" }}>{project.data.summary}</p>
                    <p className="rt-card__meta" style={{ margin: 0 }}>
                      STATUS: {state.label}
                      <br />
                      <span aria-hidden="true">{state.bar}</span>
                      <br />
                      SOURCE: {project.data.github ? "PUBLIC" : "NOT ONLINE"}
                    </p>
                  </a>
                </li>
              );
            })}
          </ul>

          <p className="rt-note" style={{ margin: "10px 0 0" }}>
            (The progress bars are decoration. The projects are not. The "NEW!"
            badge has been on that first one since roughly 2003.)
          </p>
        </div>
      </div>

      <div className="rt-hr rt-hr--stars" />

      <div className="rt-panel">
        <div className="rt-panel__title rt-panel__title--plain">
          Directory of C:\WEB\KORIKOSMOS\PROJECTS
        </div>
        <div className="rt-panel__body">
          <table className="rt-table">
            <caption className="rt-sr-only">
              The same projects listed as a fake MS-DOS directory. File names,
              sizes and status columns are decorative; the project names link to
              the real pages.
            </caption>
            <thead>
              <tr>
                <th scope="col">File</th>
                <th scope="col">Project</th>
                <th scope="col">Size</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.slug}>
                  <td className="rt-mono">{dosName(project.slug)}</td>
                  <td>
                    <a href={`/portfolio/${project.slug}/`}>
                      {project.data.title}
                    </a>
                  </td>
                  <td className="rt-mono">{fakeSize(project)}</td>
                  <td className="rt-mono">{status(project).label}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="rt-note" style={{ margin: "8px 0 0" }}>
            {projects.length} File(s) &nbsp;&nbsp; 0 Dir(s) &nbsp;&nbsp;
            1,457,664 bytes free
          </p>
        </div>
      </div>

      <div className="rt-panel">
        <div className="rt-panel__title">Coming Soon!!</div>
        <div className="rt-panel__body rt-center">
          <img
            className="rt-construction"
            src="/retro/gfx/construction.svg"
            alt="Under construction"
            width={180}
            height={60}
          />
          <p style={{ margin: "6px 0 0" }}>
            More projects are being uploaded as fast as my 56k modem allows.
            Please check back soon!{" "}
            <span className="rt-glow" aria-hidden="true">
              (๑˃ᴗ˂)ﻭ
            </span>
          </p>
          <div className="rt-hr rt-hr--hearts" />
          <p className="rt-row" style={{ justifyContent: "center", margin: 0 }}>
            <a className="rt-btn rt-btn--primary" href="/guestbook">
              ✍ Sign my guestbook
            </a>
            <a className="rt-btn" href="/about">
              Who made all this?
            </a>
            <a className="rt-btn" href="/blog">
              Read the web log
            </a>
          </p>
          <p className="rt-note" style={{ margin: "8px 0 0" }}>
            This page was hand-typed in Notepad. Do not view source, it is
            embarrassing.
          </p>
        </div>
      </div>
    </>
  );
}

export default RetroPortfolioPage;
