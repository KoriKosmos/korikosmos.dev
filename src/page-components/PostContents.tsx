import type { ArticleHeading } from '../lib/reading';

export function PostContents({ headings, retro = false }: { headings: ArticleHeading[]; retro?: boolean }) {
  const sections = headings.filter(heading => heading.depth === 2 || heading.depth === 3);
  if (sections.length < 2) return null;

  return (
    <nav aria-label="On this page" className={retro ? 'rt-inset rt-post-contents' : 'my-6 rounded-xl border border-base-content/10 bg-base-200/70 p-5'}>
      <h2 className={retro ? 'rt-subhead' : 'text-sm font-bold uppercase tracking-wider mb-3'}>On this page</h2>
      <ol className={retro ? 'rt-post-contents__list' : 'space-y-2 text-sm'}>
        {sections.map(heading => (
          <li key={heading.slug} className={heading.depth === 3 ? (retro ? 'rt-post-contents__nested' : 'ml-4') : undefined}>
            <a className={retro ? '' : 'link link-hover text-primary'} href={`#${heading.slug}`}>{heading.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default PostContents;
