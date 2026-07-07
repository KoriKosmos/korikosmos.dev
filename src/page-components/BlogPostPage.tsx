import type { ReactNode } from "react";

interface Props {
  title: string;
  children?: ReactNode;
}

export function BlogPostPage({ title, children }: Props) {
  return (
    <article className="prose dark:prose-invert my-8">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      {children}
    </article>
  );
}
