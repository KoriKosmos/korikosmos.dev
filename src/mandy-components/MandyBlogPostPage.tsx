import type { ReactNode } from 'react';
import { formatPostDate, type ArticleHeading } from '../lib/reading';

/**
 * A single blog post in Mandy mode.
 *
 * `children` is markdown already rendered to HTML by Astro's <Content />; it
 * goes inside .md-prose, which supplies the article typography. The
 * `data-reader-content` attribute is load-bearing: ReadingTools (rendered by
 * the route as its own island) measures and decorates that element, and does
 * nothing at all without it.
 *
 * The table of contents is built here rather than through PostContents, whose
 * markup is modern/retro only. Same rule as there: h2/h3 only, and only when
 * there are at least two of them.
 */

interface Props {
  title: string;
  description: string;
  /** ISO date string */
  pubDate: string;
  /** ISO date string */
  updatedDate?: string;
  minutes: number;
  headings: ArticleHeading[];
  children?: ReactNode;
}

export function MandyBlogPostPage({ title, description, pubDate, updatedDate, minutes, headings, children }: Props) {
  const sections = headings.filter(heading => heading.depth === 2 || heading.depth === 3);

  return (
    <article className="md-section md-section--first md-section--static">
      <div className="md-section__head" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <h1 className="md-section__title">{title}</h1>
        <span className="md-section__tag">
          <time dateTime={pubDate}>{formatPostDate(pubDate)}</time>
          {' · '}{minutes} min read
          {updatedDate && (
            <> · updated <time dateTime={updatedDate}>{formatPostDate(updatedDate)}</time></>
          )}
        </span>
      </div>

      <p className="md-note" style={{ fontSize: '1.02rem', fontStyle: 'italic' }}>{description}</p>

      {sections.length >= 2 && (
        <nav aria-label="On this page" className="md-toc">
          <h2 className="md-toc__title">On this page</h2>
          <ol>
            {sections.map(heading => (
              <li key={heading.slug} className={heading.depth === 3 ? 'md-toc__nested' : undefined}>
                <a href={`#${heading.slug}`}>{heading.text}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div data-reader-content className="md-prose">{children}</div>

      <p className="md-actions">
        <a className="md-btn md-btn--ghost" href="/blog">&larr; All posts</a>
        <a className="md-btn md-btn--ghost" href="/guestbook">Sign the guestbook</a>
        <a className="md-btn md-btn--ghost" href="/rss.xml">RSS feed</a>
      </p>
    </article>
  );
}

export default MandyBlogPostPage;
