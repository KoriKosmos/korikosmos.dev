/**
 * The posts-and-projects list behind Mandy mode's nav search and the modern
 * skin's ⌘K palette.
 *
 * It used to be serialised into every page's island props, which made every
 * HTML response grow with each new post. Now it is one prerendered file
 * (src/pages/content-index.json.ts) that the islands fetch the first time
 * someone actually searches. The nav pages themselves stay inline: they're a
 * handful of entries and should be searchable instantly.
 *
 * Safe to import from client bundles: no server-only dependencies.
 */

export interface ContentIndexItem {
  section: 'Blog' | 'Projects';
  title: string;
  desc: string;
  url: string;
}

export const CONTENT_INDEX_URL = '/content-index.json';

let request: Promise<ContentIndexItem[]> | null = null;

/**
 * Fetch the index once per page and share it between callers. A failure
 * resolves to an empty list (search still covers the pages) and is forgotten,
 * so the next search tries again.
 */
export function loadContentIndex(fetcher: typeof fetch = fetch): Promise<ContentIndexItem[]> {
  request ??= fetcher(CONTENT_INDEX_URL)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<ContentIndexItem[]>;
    })
    .then(items => (Array.isArray(items) ? items : []))
    .catch(() => {
      request = null;
      return [];
    });
  return request;
}
