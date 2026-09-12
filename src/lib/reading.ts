export interface ArticleHeading {
  depth: number;
  slug: string;
  text: string;
}

/** An estimate, including code, with Markdown destinations and markup removed. */
export function readingMinutes(markdown: string): number {
  const text = markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_`~|]/g, ' ');
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 220));
}

export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}
