import type { DiscoveryState } from '../lib/contentDiscovery';

export interface ContentFiltersProps {
  kind: 'blog' | 'projects';
  state: DiscoveryState;
  count: number;
  total: number;
  retro?: boolean;
}

/** A normal GET form keeps discovery linkable and useful without JavaScript. */
export function ContentFilters({ kind, state, count, total, retro = false }: ContentFiltersProps) {
  const blog = kind === 'blog';
  const path = blog ? '/blog' : '/portfolio';
  const noun = blog ? 'posts' : 'projects';
  const orders = blog
    ? [['newest', 'Newest first'], ['oldest', 'Oldest first'], ['title', 'Title: A to Z']]
    : [['title', 'Title: A to Z'], ['title-desc', 'Title: Z to A']];
  const changed = Boolean(state.query || state.sourceOnly || state.sort !== orders[0][0]);
  const fieldClass = retro ? 'rt-discovery__field' : 'input input-bordered bg-base-100 w-full';

  return (
    <form
      action={path}
      method="get"
      role="search"
      aria-label={`Search ${noun}`}
      className={retro ? 'rt-discovery rt-inset' : 'rounded-2xl border border-base-content/10 bg-base-200/70 p-5 mb-6'}
    >
      <div className={retro ? 'rt-discovery__controls' : 'flex flex-wrap items-end gap-3'}>
        <label className={retro ? 'rt-discovery__query' : 'flex-1 min-w-0 basis-52'}>
          <span className={retro ? 'rt-small' : 'block text-sm font-semibold mb-2'}>Search {noun}</span>
          <input
            type="search"
            name="q"
            defaultValue={state.query}
            maxLength={120}
            placeholder={blog ? 'Try React, homelab, or creativity…' : 'Try Java, Astro, or SGX…'}
            className={fieldClass}
          />
        </label>
        <label className={retro ? '' : 'flex-1 basis-40'}>
          <span className={retro ? 'rt-small' : 'block text-sm font-semibold mb-2'}>Sort by</span>
          <select name="sort" defaultValue={state.sort} className={retro ? fieldClass : 'select select-bordered bg-base-100 w-full'}>
            {orders.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button type="submit" className={retro ? 'rt-btn rt-btn--primary' : 'btn btn-primary'}>Apply</button>
      </div>
      {!blog && (
        <label className={retro ? 'rt-discovery__source rt-small' : 'flex items-center gap-2 mt-4 text-sm cursor-pointer'}>
          <input type="checkbox" name="source" value="github" defaultChecked={state.sourceOnly} className={retro ? '' : 'checkbox checkbox-primary checkbox-sm'} />
          With source on GitHub
        </label>
      )}
      <div className={retro ? 'rt-discovery__summary rt-small' : 'flex flex-wrap justify-between gap-2 mt-4 text-sm text-base-content/70'}>
        <p className={retro ? undefined : 'min-w-0 break-words'}>{count} of {total} {noun}{state.query && <> matching “{state.query}”</>}</p>
        {changed && <a className={retro ? '' : 'link link-primary'} href={path}>Clear filters</a>}
      </div>
      {count === 0 && total > 0 && (
        <p className={retro ? 'rt-note' : 'mt-3 text-sm'}>No matches yet. Try a different search or <a href={path} className={retro ? '' : 'link'}>browse all {noun}</a>.</p>
      )}
    </form>
  );
}

export default ContentFilters;
