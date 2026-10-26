import type { DiscoveryState } from '../lib/contentDiscovery';
import type { Skin } from '../lib/skin';

export interface ContentFiltersProps {
  kind: 'blog' | 'projects';
  state: DiscoveryState;
  count: number;
  total: number;
  /** Legacy shorthand for `skin="retro"`; existing retro callers still pass it. */
  retro?: boolean;
  /** Which skin's class vocabulary to render with. Wins over `retro` when set. */
  skin?: Skin;
}

/** A normal GET form keeps discovery linkable and useful without JavaScript. */
export function ContentFilters({ kind, state, count, total, retro = false, skin }: ContentFiltersProps) {
  const active: Skin = skin ?? (retro ? 'retro' : 'modern');
  // One class (or undefined) per skin. Modern and retro values are exactly what
  // this component rendered before Mandy mode existed.
  const pick = <T,>(modern: T, retroValue: T, mandy: T): T =>
    active === 'mandy' ? mandy : active === 'retro' ? retroValue : modern;

  const blog = kind === 'blog';
  const path = blog ? '/blog' : '/portfolio';
  const noun = blog ? 'posts' : 'projects';
  const orders = blog
    ? [['newest', 'Newest first'], ['oldest', 'Oldest first'], ['title', 'Title: A to Z']]
    : [['title', 'Title: A to Z'], ['title-desc', 'Title: Z to A']];
  const changed = Boolean(state.query || state.sourceOnly || state.sort !== orders[0][0]);
  const fieldClass = pick('input input-bordered bg-base-100 w-full', 'rt-discovery__field', 'md-discovery__field');

  return (
    <form
      action={path}
      method="get"
      role="search"
      aria-label={`Search ${noun}`}
      className={pick('rounded-2xl border border-base-content/10 bg-base-200/70 p-5 mb-6', 'rt-discovery rt-inset', 'md-discovery')}
    >
      <div className={pick('flex flex-wrap items-end gap-3', 'rt-discovery__controls', 'md-discovery__controls')}>
        <label className={pick('flex-1 min-w-0 basis-52', 'rt-discovery__query', 'md-discovery__query')}>
          <span className={pick('block text-sm font-semibold mb-2', 'rt-small', 'md-discovery__label')}>Search {noun}</span>
          <input
            type="search"
            name="q"
            defaultValue={state.query}
            maxLength={120}
            placeholder={blog ? 'Try React, homelab, or creativity…' : 'Try Java, Astro, or SGX…'}
            className={fieldClass}
          />
        </label>
        <label className={pick('flex-1 basis-40', '', '')}>
          <span className={pick('block text-sm font-semibold mb-2', 'rt-small', 'md-discovery__label')}>Sort by</span>
          <select name="sort" defaultValue={state.sort} className={pick('select select-bordered bg-base-100 w-full', fieldClass, fieldClass)}>
            {orders.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button type="submit" className={pick('btn btn-primary', 'rt-btn rt-btn--primary', 'md-btn')}>Apply</button>
      </div>
      {!blog && (
        <label className={pick('flex items-center gap-2 mt-4 text-sm cursor-pointer', 'rt-discovery__source rt-small', 'md-discovery__source')}>
          <input type="checkbox" name="source" value="github" defaultChecked={state.sourceOnly} className={pick('checkbox checkbox-primary checkbox-sm', '', '')} />
          With source on GitHub
        </label>
      )}
      <div className={pick('flex flex-wrap justify-between gap-2 mt-4 text-sm text-base-content/70', 'rt-discovery__summary rt-small', 'md-discovery__summary')}>
        <p className={pick<string | undefined>('min-w-0 break-words', undefined, undefined)}>{count} of {total} {noun}{state.query && <> matching “{state.query}”</>}</p>
        {changed && <a className={pick('link link-primary', '', '')} href={path}>Clear filters</a>}
      </div>
      {count === 0 && total > 0 && (
        <p className={pick('mt-3 text-sm', 'rt-note', 'md-note')}>No matches yet. Try a different search or <a href={path} className={pick('link', '', '')}>browse all {noun}</a>.</p>
      )}
    </form>
  );
}

export default ContentFilters;
