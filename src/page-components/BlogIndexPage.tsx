import type { CollectionEntry } from "astro:content";

interface Props {
  posts: CollectionEntry<"blog">[];
}

export function BlogIndexPage({ posts }: Props) {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Blog</h1>
        <a href="/rss.xml" className="btn btn-sm btn-ghost gap-2" title="RSS Feed">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 11a9 9 0 0 1 9 9"></path>
            <path d="M4 4a16 16 0 0 1 16 16"></path>
            <circle cx="5" cy="19" r="1"></circle>
          </svg>
          RSS
        </a>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 opacity-60">
          <p className="text-xl">No posts yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {posts
            .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
            .map((post) => (
              <a
                key={post.slug}
                href={`/blog/${post.slug}/`}
                className="block p-6 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-white transition-transform text-primary-content"
              >
                <h2 className="text-2xl font-bold mb-2">{post.data.title}</h2>
                <p className="opacity-90 line-clamp-2">{post.data.description}</p>
                <div className="mt-4 text-sm opacity-90 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {new Date(post.data.pubDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </a>
            ))}
        </div>
      )}
    </>
  );
}
