import type { CollectionEntry } from 'astro:content';
import { ContentFilters, type ContentFiltersProps } from '../page-components/ContentFilters';

/**
 * The portfolio in Mandy mode: page head, the shared search/sort form, and an
 * md-grid of project cards. Same projects, order and links as PortfolioPage.tsx.
 *
 * The card is the <li>, not an <a>, so it can hold both the project link and
 * the separate GitHub link (nested anchors are invalid HTML).
 */

interface Props {
  projects: CollectionEntry<'projects'>[];
  filters?: ContentFiltersProps;
}

export function MandyPortfolioPage({ projects, filters }: Props) {
  const total = filters?.total ?? projects.length;
  const withSource = projects.filter(project => project.data.github).length;

  return (
    <>
      <section className="md-section md-section--first">
        <div className="md-section__head">
          <h1 className="md-section__title">Portfolio</h1>
          <span className="md-section__tag">// {total} {total === 1 ? 'project' : 'projects'}</span>
        </div>
        <div className="md-section__body">
          <p>
            Things I have actually built, from coursework to my final-year project. Each one
            has a write-up; the ones with public source link straight to GitHub.
          </p>
        </div>
      </section>

      <section className="md-section md-section--wide md-section--static" style={{ paddingTop: 0 }}>
        {filters && <ContentFilters {...filters} skin="mandy" />}

        <ul className="md-grid">
          {projects.map((project, index) => (
            <li key={project.slug} className={index % 2 ? 'md-card md-card--alt' : 'md-card'}>
              <h2 className="md-card__title">
                <a href={`/portfolio/${project.slug}/`} style={{ color: 'inherit' }}>{project.data.title}</a>
              </h2>
              <span className="md-card__desc">{project.data.summary}</span>
              <span className="md-card__meta">
                {project.data.github ? (
                  <a
                    href={project.data.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Source code for ${project.data.title} on GitHub (opens in a new tab)`}
                  >
                    source on GitHub &#8599;
                  </a>
                ) : (
                  'source not public'
                )}
                {' · '}
                <a href={`/portfolio/${project.slug}/`} aria-label={`Read the write-up for ${project.data.title}`}>write-up</a>
              </span>
            </li>
          ))}
        </ul>

        {projects.length > 0 && (
          <p className="md-note" style={{ marginTop: '1.2rem' }}>
            {withSource} of {projects.length} with public source. The rest are locked in a
            basement chest, and no, I don't have the key.
          </p>
        )}
      </section>
    </>
  );
}

export default MandyPortfolioPage;
