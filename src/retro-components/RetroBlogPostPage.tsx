import type { ReactNode } from "react";
import type { ArticleHeading } from '../lib/reading';
import { PostContents } from '../page-components/PostContents';

/**
 * A single blog post in the Web 1.0 skin.
 *
 * `children` is markdown already rendered to HTML by Astro's <Content />, so
 * the only job here is to wrap it in .rt-prose (which supplies the article
 * typography) and surround it with period furniture: a title bar, a byline,
 * the description as a lead-in, and a back link.
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

const LONG_DATE: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", LONG_DATE);
}

export function RetroBlogPostPage({
  title,
  description,
  pubDate,
  updatedDate,
  minutes,
  headings,
  children,
}: Props) {
  return (
    <article>
      <div className="rt-panel">
        <div className="rt-panel__title">
          <span className="rt-mono">Now reading: {title}</span>
        </div>

        <div className="rt-panel__body">
          <h1 className="rt-heading">{title}</h1>

          <p className="rt-center rt-alt rt-small" style={{ marginBottom: "10px" }}>
            Posted on{" "}
            <time dateTime={pubDate}>
              <strong>{longDate(pubDate)}</strong>
            </time>{" "}
            by <strong>Maan</strong>
            <span> · {minutes} min read</span>
            {updatedDate && (
              <>
                <span aria-hidden="true"> &nbsp;•&nbsp; </span>
                <span className="rt-soft">
                  last updated{" "}
                  <time dateTime={updatedDate}>{longDate(updatedDate)}</time>
                </span>
              </>
            )}
          </p>

          <div className="rt-inset rt-serif" style={{ marginBottom: "10px" }}>
            <p style={{ margin: 0 }}>
              <span className="rt-alt rt-small rt-soft">In this entry: </span>
              <em>{description}</em>
            </p>
          </div>

          <div className="rt-hr"></div>

          <PostContents headings={headings} retro />
          <div data-reader-content className="rt-prose">{children}</div>

          <div className="rt-hr rt-hr--stars"></div>

          <p className="rt-center rt-note" style={{ marginBottom: "10px" }}>
            Thank you for reading all the way to the bottom.{" "}
            <span className="rt-wobble" aria-hidden="true">
              (◕‿◕)
            </span>{" "}
            Please do not right-click and steal my HTML.
          </p>

          <div className="rt-row" style={{ justifyContent: "center" }}>
            <a className="rt-btn" href="/blog">
              &laquo; Back to the web log
            </a>
            <a className="rt-btn rt-btn--primary" href="/guestbook">
              Sign my guestbook!
            </a>
            <a className="rt-btn" href="/rss.xml">
              XML feed
            </a>
          </div>
        </div>
      </div>

      <p className="rt-center rt-small" style={{ margin: 0 }}>
        <img
          className="rt-blinkie"
          src="/retro/blinkies/email.svg"
          alt="E-mail me"
          width={150}
          height={20}
        />
        Comments? <a href="mailto:kori@korikosmos.dev">kori@korikosmos.dev</a>{" "}
        <span className="rt-soft">— replies within 3&ndash;5 business dial-ups.</span>
      </p>
    </article>
  );
}

export default RetroBlogPostPage;
