import type { ReactNode } from "react";
import { formatPostDate, type ArticleHeading } from '../lib/reading';
import { PostContents } from './PostContents';

interface Props {
  title: string;
  description: string;
  pubDate: string;
  updatedDate?: string;
  minutes: number;
  headings: ArticleHeading[];
  children?: ReactNode;
}

export function BlogPostPage({ title, description, pubDate, updatedDate, minutes, headings, children }: Props) {
  return (
    <article className="my-8 min-w-0">
      <a href="/blog" className="text-sm link link-hover text-primary">← All posts</a>
      <header className="mt-5">
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">{title}</h1>
        <p className="text-sm text-base-content/70 flex flex-wrap gap-x-3 gap-y-1">
          <span>By Maan</span>
          <time dateTime={pubDate}>{formatPostDate(pubDate)}</time>
          <span>{minutes} min read</span>
          {updatedDate && <span>Updated <time dateTime={updatedDate}>{formatPostDate(updatedDate)}</time></span>}
        </p>
        <p className="text-lg text-base-content/80 mt-4">{description}</p>
      </header>
      <PostContents headings={headings} />
      <div data-reader-content className="prose max-w-none mt-8">{children}</div>
    </article>
  );
}
