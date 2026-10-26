import type { CollectionEntry } from 'astro:content';
import { ContentFilters, type ContentFiltersProps } from '../page-components/ContentFilters';
import { formatPostDate, readingMinutes } from '../lib/reading';

/**
 * The blog index in Mandy mode: a ruled page head, the shared search/sort form,
 * and the posts as left-bordered md-post rows. Same posts, order and links as
 * BlogIndexPage.tsx / RetroBlogIndexPage.tsx. Purely presentational, so it
 * renders to static HTML with no client JS.
 */

interface Props {
  posts: CollectionEntry<'blog'>[];
  newestPost: CollectionEntry<'blog'> | undefined;
  filters?: ContentFiltersProps;
}

export function MandyBlogIndexPage({ posts, newestPost, filters }: Props) {
  const total = filters?.total ?? posts.length;

  return (
    <>
      <section className="md-section md-section--first">
        <div className="md-section__head">
          <h1 className="md-section__title">Blog</h1>
          <span className="md-section__tag">// {total} {total === 1 ? 'post' : 'posts'} on file</span>
        </div>
        <div className="md-section__body">
          <p>
            Notes on tech, creativity and the projects I keep starting. Written slower than a
            Binding of Isaac run, published more often than a Batman reboot.
          </p>
          <p className="md-note">
            Prefer a feed reader? <a href="/rss.xml">Grab the RSS feed</a>.
            {newestPost && (
              <> Latest: <time dateTime={newestPost.data.pubDate.toISOString()}>{formatPostDate(newestPost.data.pubDate.toISOString())}</time>.</>
            )}
          </p>
        </div>
      </section>

      <section className="md-section md-section--static" style={{ paddingTop: 0 }}>
        {filters && <ContentFilters {...filters} skin="mandy" />}

        {posts.length === 0 && !filters?.total ? (
          <p className="md-note">
            No posts yet. The Bat-Signal is up; check back soon, or{' '}
            <a href="/guestbook">sign the guestbook</a> in the meantime.
          </p>
        ) : (
          <ol className="md-posts" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {posts.map(post => (
              <li key={post.slug}>
                <a className="md-post" href={`/blog/${post.slug}/`}>
                  <span className="md-post__date">
                    <time dateTime={post.data.pubDate.toISOString()}>{formatPostDate(post.data.pubDate.toISOString())}</time>
                    {' · '}{readingMinutes(post.body)} min read
                    {post.slug === newestPost?.slug && ' · new'}
                  </span>
                  <span className="md-post__title">{post.data.title}</span>
                  <span className="md-post__desc">{post.data.description}</span>
                </a>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

export default MandyBlogIndexPage;
