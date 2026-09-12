import type { CollectionEntry } from "astro:content";
import { ContentFilters, type ContentFiltersProps } from '../page-components/ContentFilters';
import { readingMinutes } from '../lib/reading';

/**
 * The blog index, re-dressed as a 2003 "web log".
 *
 * Same posts, same links, same descriptions as BlogIndexPage.tsx — every entry
 * is a beveled window panel with the date in its title bar, the newest one
 * wearing a blinking NEW! badge. Purely presentational: no client:* directive,
 * so this renders to static HTML.
 */

interface Props {
  posts: CollectionEntry<"blog">[];
  newestPost: CollectionEntry<"blog"> | undefined;
  filters?: ContentFiltersProps;
}

const LONG_DATE: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

/** Title-bar style: 10-JUL-2026, the way a log file would have printed it. */
function stampDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = date
    .toLocaleDateString("en-GB", { month: "short" })
    .toUpperCase();
  return `${day}-${month}-${date.getFullYear()}`;
}

export function RetroBlogIndexPage({ posts: sorted, newestPost, filters }: Props) {
  const total = filters?.total ?? sorted.length;
  const latestStamp = newestPost
    ? newestPost.data.pubDate.toLocaleDateString("en-GB", LONG_DATE)
    : null;

  return (
    <>
      <h1 className="rt-heading">
        <span className="rt-rainbow">My Web Log</span>
      </h1>

      <div className="rt-panel">
        <div className="rt-panel__title rt-panel__title--plain">
          Welcome to the log
        </div>
        <div className="rt-panel__body">
          <p className="rt-alt rt-small" style={{ marginBottom: "8px" }}>
            Thoughts on tech, creativity and personal projects, typed out by
            hand and uploaded over a connection I am very proud of.{" "}
            <span className="rt-wobble" aria-hidden="true">
              (￣▽￣)ノ
            </span>
          </p>

          <div className="rt-row">
            <a className="rt-btn rt-btn--primary" href="/rss.xml">
              XML SYNDICATION!!
            </a>
            <span className="rt-note">
              Point your news reader at{" "}
              <span className="rt-mono">/rss.xml</span> and the posts come to
              YOU. The future is amazing.
            </span>
          </div>

          <div className="rt-inset rt-mono rt-small" style={{ marginTop: "10px" }}>
            <span aria-hidden="true">&gt; </span>
            {total} {total === 1 ? "entry" : "entries"} on file
            {latestStamp ? ` · most recent update ${latestStamp}` : ""}
            <span className="rt-blink" aria-hidden="true">
              _
            </span>
          </div>
        </div>
      </div>

      <div className="rt-hr"></div>

      {filters && <ContentFilters {...filters} retro />}
      {sorted.length === 0 && !filters?.total ? (
        <div className="rt-panel">
          <div className="rt-panel__title">Error: 0 entries found</div>
          <div className="rt-panel__body rt-center">
            <img
              className="rt-construction"
              src="/retro/gfx/construction.svg"
              alt="Under construction"
              width={180}
              height={60}
            />
            <p className="rt-alt" style={{ marginBottom: "4px" }}>
              This page is UNDER CONSTRUCTION. No posts yet — check back soon!
            </p>
            <p className="rt-note" style={{ margin: 0 }}>
              In the meantime you could{" "}
              <a href="/guestbook">sign my guestbook</a> so I know somebody was
              here. <span aria-hidden="true">(´･ω･`)</span>
            </p>
          </div>
        </div>
      ) : (
        <ol
          className="rt-stack"
          style={{ listStyle: "none", margin: 0, padding: 0 }}
        >
          {sorted.map(post => (
            <li key={post.slug} style={{ margin: 0 }}>
              <article className="rt-panel" style={{ marginBottom: 0 }}>
                <div className="rt-panel__title">
                  <span className="rt-mono">
                    Posted {stampDate(post.data.pubDate)}
                  </span>
                </div>
                <div className="rt-panel__body">
                  <h2 className="rt-subhead" style={{ marginTop: 0 }}>
                    <a href={`/blog/${post.slug}/`}>{post.data.title}</a>
                    {post.slug === newestPost?.slug && (
                      <>
                        {" "}
                        <img
                          className="rt-pixel"
                          src="/retro/gfx/new.svg"
                          alt="New!"
                          width={36}
                          height={16}
                        />
                      </>
                    )}
                  </h2>

                  <p className="rt-alt rt-small" style={{ marginBottom: "6px" }}>
                    <span className="rt-soft">Filed under</span>{" "}
                    <span className="rt-mono">
                      C:\WEB\KORIKOSMOS\BLOG\
                      {post.slug.replace(/-/g, "").slice(0, 8).toUpperCase()}
                      .HTM
                    </span>{" "}
                    <span className="rt-soft">on</span>{" "}
                    <time dateTime={post.data.pubDate.toISOString()}>
                      {post.data.pubDate.toLocaleDateString("en-GB", LONG_DATE)}
                    </time>
                    <span> · {readingMinutes(post.body)} min read</span>
                  </p>

                  <div className="rt-inset">
                    <p style={{ margin: 0 }}>{post.data.description}</p>
                  </div>

                  <p className="rt-row" style={{ margin: "10px 0 0" }}>
                    <a className="rt-btn" href={`/blog/${post.slug}/`}>
                      [ read more ]
                    </a>
                    <span className="rt-note">
                      {post.slug === newestPost?.slug
                        ? "Hot off the modem!"
                        : "Still perfectly good."}
                    </span>
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}

      <div className="rt-hr rt-hr--hearts"></div>

      <p className="rt-center rt-note" style={{ margin: 0 }}>
        Enjoyed a post? <a href="/guestbook">Sign my guestbook</a> or{" "}
        <a href="mailto:kori@korikosmos.dev">e-mail me</a> — I read every single
        one, there are not many.
      </p>
    </>
  );
}

export default RetroBlogIndexPage;
