import type { ReactNode } from "react";
import type { CollectionEntry } from "astro:content";

interface Props {
  project: CollectionEntry<"projects"> | undefined;
  /** Rendered entry body (Astro <Content />), passed pre-rendered from the .astro page */
  children?: ReactNode;
}

/**
 * The Web 1.0 project page. Same title, description, body and GitHub link as
 * the modern one — just wearing a 2004 download page over the top.
 */
export function RetroProjectDetailPage({ project, children }: Props) {
  if (!project) {
    return (
      <div className="rt-panel">
        <div className="rt-panel__title">Error 404 — File Not Found</div>
        <div className="rt-panel__body rt-center">
          <p className="rt-mono" style={{ marginBottom: "6px" }}>
            <span className="rt-blink" aria-hidden="true">
              !
            </span>{" "}
            THE REQUESTED PROJECT COULD NOT BE LOCATED ON THIS SERVER{" "}
            <span className="rt-blink" aria-hidden="true">
              !
            </span>
          </p>
          <div className="rt-inset rt-mono rt-small rt-center">
            C:\WEB\KORIKOSMOS\PROJECTS&gt; dir
            <br />
            File not found.
          </div>
          <p style={{ margin: "10px 0 0" }}>
            It may have been moved to a floppy disk, or it never existed. Sorry!{" "}
            <span aria-hidden="true">(｡•́︿•̀｡)</span>
          </p>
          <p style={{ margin: "10px 0 0" }}>
            <a className="rt-btn rt-btn--primary" href="/portfolio">
              &laquo; Back to the projects directory
            </a>
          </p>
        </div>
      </div>
    );
  }

  const { title, description, github } = project.data;

  return (
    <article>
      <h1 className="rt-heading">{title}</h1>

      <div className="rt-panel">
        <div className="rt-panel__title">
          C:\WEB\KORIKOSMOS\PROJECTS\{project.slug.toUpperCase()}
        </div>
        <div className="rt-panel__body">
          <h2 className="rt-subhead" style={{ marginTop: 0 }}>
            What Is It?
          </h2>

          <div className="rt-inset rt-alt">{description}</div>

          {/* The entry body, if the markdown file has one. No heading and no
              divider above it — most project files are frontmatter only, and a
              section header introducing nothing is worse than no header. */}
          <div className="rt-prose" style={{ marginTop: "10px" }}>
            {children}
          </div>
        </div>
      </div>

      {github && (
        <div className="rt-panel">
          <div className="rt-panel__title">Downloads</div>
          <div className="rt-panel__body rt-center">
            <p className="rt-alt rt-small" style={{ marginBottom: "8px" }}>
              <span className="rt-rainbow">100% FREE!</span> &nbsp;•&nbsp; No
              spyware &nbsp;•&nbsp; No registration &nbsp;•&nbsp; Works on any
              computer
            </p>
            <p style={{ margin: "0 0 8px" }}>
              <a
                className="rt-btn rt-btn--primary"
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View the source code for ${title} on GitHub (opens in a new tab)`}
              >
                ⬇ CLICK HERE TO GET THE SOURCE CODE ⬇
              </a>
            </p>
            <p className="rt-mono rt-small" style={{ margin: 0 }}>
              Hosted on GitHub &nbsp;•&nbsp; opens in a new window
            </p>
            <p className="rt-note" style={{ margin: "6px 0 0" }}>
              Estimated download time: 4 minutes on 56k. Please do not pick up
              the telephone.
            </p>
          </div>
        </div>
      )}

      <div className="rt-hr rt-hr--hearts" />

      <div className="rt-panel">
        <div className="rt-panel__title rt-panel__title--plain">
          Where to next?
        </div>
        <div className="rt-panel__body">
          <p className="rt-row" style={{ margin: 0 }}>
            <a className="rt-btn" href="/portfolio">
              &laquo; Back to my projects
            </a>
            <a className="rt-btn" href="/guestbook">
              ✍ Sign my guestbook
            </a>
            <a className="rt-btn" href="/blog">
              Read the web log
            </a>
          </p>
          <p className="rt-note" style={{ margin: "8px 0 0" }}>
            Enjoyed this page? Tell a friend, or print it out and put it on the
            fridge.
          </p>
        </div>
      </div>
    </article>
  );
}

export default RetroProjectDetailPage;
