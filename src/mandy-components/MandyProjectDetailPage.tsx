import type { ReactNode } from 'react';
import type { CollectionEntry } from 'astro:content';

/**
 * A single project in Mandy mode. Same title, description, body and GitHub link
 * as ProjectDetailPage.tsx; the route already rewrites unknown slugs to /404,
 * so `project` is always present here.
 */

interface Props {
  project: CollectionEntry<'projects'>;
  /** Rendered entry body (Astro <Content />), passed pre-rendered from the .astro page */
  children?: ReactNode;
}

export function MandyProjectDetailPage({ project, children }: Props) {
  const { title, summary, description, github } = project.data;

  return (
    <article className="md-section md-section--first md-section--static">
      <div className="md-section__head">
        <h1 className="md-section__title">{title}</h1>
        <span className="md-section__tag">// project</span>
      </div>

      <p className="md-note" style={{ fontSize: '1.02rem' }}>{summary}</p>

      <div className="md-entry">
        <p style={{ margin: 0 }}>{description}</p>
      </div>

      {/* Most project files are frontmatter only, so no heading above the body:
          a section header introducing nothing is worse than none. */}
      <div className="md-prose">{children}</div>

      <p className="md-actions">
        <a className="md-btn md-btn--ghost" href="/portfolio">&larr; All projects</a>
        {github && (
          <a
            className="md-btn"
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View the source code for ${title} on GitHub (opens in a new tab)`}
          >
            Source on GitHub &#8599;
          </a>
        )}
      </p>
    </article>
  );
}

export default MandyProjectDetailPage;
