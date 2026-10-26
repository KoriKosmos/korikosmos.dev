import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactElement, type RefObject } from 'react';
import { MANDY_THEME_COOKIE, MANDY_THEMES, type MandyTheme } from '../lib/skin';

/**
 * Mandy mode's top bar, after amandata.dev's: home mark, a page-search box with
 * suggestions, dropdown menus, a quick "play" link, and a "Change Theme" menu.
 *
 * Server-rendered by Astro and hydrated with client:load, so every link is in
 * the HTML before any JS runs. Dropdowns follow the ARIA menu-button pattern:
 * Enter/Space/ArrowDown opens and focuses the first item, arrows move, Escape
 * closes and returns focus, Tab closes.
 *
 * The theme is a cookie (rendered onto <html> server-side next time) and is
 * applied live by swapping data-theme; MandyBackdrop watches that attribute.
 */

export interface MandyNavLink {
  href: string;
  label: string;
  external: boolean;
  active: boolean;
}

export interface MandyNavGroup {
  key: string;
  /** null for a plain top-level link (a one-item group with no menu). */
  label: string | null;
  links: MandyNavLink[];
  active: boolean;
}

export interface MandySearchItem {
  title: string;
  desc: string;
  url: string;
}

interface Props {
  groups: MandyNavGroup[];
  search: MandySearchItem[];
  isHome: boolean;
  theme: MandyTheme;
}

const ONE_YEAR = 60 * 60 * 24 * 365;

export const MANDY_THEME_INFO: Record<MandyTheme, { label: string; blurb: string; swatches: string[] }> = {
  gotham: { label: 'Gotham', blurb: 'Batman', swatches: ['#0B0C10', '#F5C518', '#8FA3BF'] },
  basement: { label: 'Basement', blurb: 'The Binding of Isaac', swatches: ['#1A110C', '#E04A33', '#D9A55B'] },
  kanto: { label: 'Kanto', blurb: 'Pokémon', swatches: ['#F6F4EC', '#D7261E', '#2A62B8'] },
  inkwell: { label: 'Inkwell', blurb: 'Comics', swatches: ['#F3EBD8', '#C8006E', '#00739E'] },
};

/** Pixel bat — the home mark. 16x9 grid, one rect per pixel run. */
function BatMark() {
  const rows = [
    '.......X..X.....',
    'X.....XXXXXX...X',
    'XX...XXXXXXXX.XX',
    'XXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXX',
    '.XXXXXXXXXXXXXX.',
    '..XX..XXXXX..XX.',
    '.......XXX......',
    '........X.......',
  ];
  const rects: ReactElement[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== 'X') { x++; continue; }
      let w = 0;
      while (row[x + w] === 'X') w++;
      rects.push(<rect key={`${x}-${y}`} className="px" x={x} y={y} width={w} height={1} />);
      x += w;
    }
  });
  return (
    <svg viewBox="0 0 16 9" width="32" height="18" shapeRendering="crispEdges" aria-hidden="true">
      {rects}
    </svg>
  );
}

function useOutsideClose(ref: RefObject<HTMLElement | null>, active: boolean, close: () => void) {
  useEffect(() => {
    if (!active) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [ref, active, close]);
}

function Dropdown({
  group,
  open,
  setOpen,
}: {
  group: MandyNavGroup & { label: string };
  open: boolean;
  setOpen: (key: string | null) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [alignRight, setAlignRight] = useState(false);

  const items = () => Array.from(wrap.current?.querySelectorAll<HTMLAnchorElement>('.md-nav__menu-link') ?? []);

  const openMenu = (focus: 'first' | 'last' | null) => {
    // keep the panel inside the viewport on narrow screens
    const r = toggle.current?.getBoundingClientRect();
    setAlignRight(!!r && r.left + 230 > window.innerWidth - 8);
    setOpen(group.key);
    if (focus) requestAnimationFrame(() => {
      const list = items();
      (focus === 'first' ? list[0] : list[list.length - 1])?.focus();
    });
  };

  const onToggleKey = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMenu('first');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      openMenu('last');
    } else if (e.key === 'Escape') {
      setOpen(null);
    }
  };

  const onMenuKey = (e: ReactKeyboardEvent) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLAnchorElement);
    const move = (n: number) => { e.preventDefault(); list[(n + list.length) % list.length]?.focus(); };
    if (e.key === 'Escape') { e.preventDefault(); setOpen(null); toggle.current?.focus(); }
    else if (e.key === 'ArrowDown') move(i + 1);
    else if (e.key === 'ArrowUp') move(i - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(list.length - 1);
    else if (e.key === 'Tab') setOpen(null);
  };

  return (
    <div ref={wrap} className={`md-nav__item${alignRight ? ' md-nav__item--right' : ''}`}>
      <button
        ref={toggle}
        type="button"
        className={`md-nav__toggle${group.active ? ' is-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={`md-menu-${group.key}`}
        id={`md-toggle-${group.key}`}
        onClick={() => (open ? setOpen(null) : openMenu(null))}
        onKeyDown={onToggleKey}
      >
        {group.label}
        <span className="md-nav__caret" aria-hidden="true" />
      </button>
      <div
        className="md-nav__menu"
        id={`md-menu-${group.key}`}
        role="menu"
        aria-labelledby={`md-toggle-${group.key}`}
        hidden={!open}
        onKeyDown={onMenuKey}
      >
        {group.links.map(link => (
          <a
            key={link.href}
            className="md-nav__menu-link"
            role="menuitem"
            href={link.href}
            aria-current={link.active ? 'page' : undefined}
            {...(link.external ? { target: '_blank', rel: 'noopener' } : {})}
          >
            {link.label}
            {link.external && <span aria-hidden="true"> ↗</span>}
          </a>
        ))}
      </div>
    </div>
  );
}

function Search({ items }: { items: MandySearchItem[] }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(-1);
  const wrap = useRef<HTMLFormElement>(null);
  useOutsideClose(wrap, open, () => setOpen(false));

  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const hits = words.length
    ? items.filter(it => {
        const hay = `${it.title} ${it.desc} ${it.url}`.toLowerCase();
        return words.every(w => hay.includes(w));
      }).slice(0, 6)
    : items.slice(0, 8);

  const onKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); (e.target as HTMLInputElement).blur(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setSel(s => Math.min(s + 1, hits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, -1)); }
  };

  return (
    <form
      ref={wrap}
      className="md-nav__search"
      role="search"
      action="/blog"
      method="get"
      autoComplete="off"
      onSubmit={e => {
        const target = hits[sel] ?? (words.length ? hits[0] : undefined);
        if (target) { e.preventDefault(); window.location.href = target.url; }
      }}
    >
      <input
        type="search"
        name="q"
        value={q}
        placeholder="search pages"
        aria-label="Search site pages"
        aria-autocomplete="list"
        aria-controls="md-suggest"
        aria-expanded={open && hits.length > 0}
        onChange={e => { setQ(e.target.value); setOpen(true); setSel(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
      />
      {open && hits.length > 0 && (
        <div className="md-nav__suggest" id="md-suggest" role="listbox" aria-label="Suggestions">
          {hits.map((hit, i) => (
            <a
              key={hit.url}
              className="md-nav__suggest-item"
              href={hit.url}
              role="option"
              aria-selected={i === sel}
            >
              <span className="md-nav__suggest-title">{hit.title}</span>
              <span className="md-nav__suggest-desc">{hit.desc}</span>
            </a>
          ))}
        </div>
      )}
    </form>
  );
}

function ThemePicker({ initial }: { initial: MandyTheme }) {
  const [theme, setTheme] = useState<MandyTheme>(initial);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useOutsideClose(wrap, open, () => setOpen(false));

  const choose = (name: MandyTheme) => {
    setTheme(name);
    document.documentElement.setAttribute('data-theme', `mandy-${name}`);
    document.cookie = `${MANDY_THEME_COOKIE}=${name}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    setOpen(false);
    btn.current?.focus();
  };

  return (
    <div
      ref={wrap}
      className="md-theme"
      onKeyDown={e => { if (e.key === 'Escape' && open) { setOpen(false); btn.current?.focus(); } }}
    >
      <button
        ref={btn}
        type="button"
        className="md-theme__toggle"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="md-theme-menu"
        onClick={() => setOpen(o => !o)}
      >
        Change Theme <span className="md-nav__caret" aria-hidden="true" />
      </button>
      <div className="md-theme__menu" id="md-theme-menu" role="menu" aria-label="Colour theme" hidden={!open}>
        {MANDY_THEMES.map(name => {
          const info = MANDY_THEME_INFO[name];
          return (
            <button
              key={name}
              type="button"
              className="md-theme__opt"
              role="menuitemradio"
              aria-checked={theme === name}
              onClick={() => choose(name)}
            >
              <span className="md-theme__swatches" aria-hidden="true">
                {info.swatches.map(c => <i key={c} style={{ background: c }} />)}
              </span>
              <span>
                {info.label}
                <small>{info.blurb}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MandyNav({ groups, search, isHome, theme }: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  useOutsideClose(navRef, openKey !== null, () => setOpenKey(null));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenKey(null); };
    const onResize = () => setOpenKey(null);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // reading progress along the bottom of the bar, homepage only
  useEffect(() => {
    if (!isHome) return;
    let queued = false;
    const update = () => {
      queued = false;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (progress.current) progress.current.style.width = `${max > 0 ? (h.scrollTop / max) * 100 : 0}%`;
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isHome]);

  return (
    <nav ref={navRef} className={`md-nav${openKey ? ' md-nav--menu-open' : ''}`} aria-label="Primary">
      <a className={`md-nav__mark${isHome ? ' is-active' : ''}`} href={isHome ? '#top' : '/'} aria-label="Home">
        <BatMark />
      </a>
      <Search items={search} />
      <div className="md-nav__links">
        {groups.map(group =>
          group.label === null ? (
            group.links.map(link => (
              <a
                key={link.href}
                className={`md-nav__link${link.active ? ' is-active' : ''}`}
                href={link.href}
                aria-current={link.active ? 'page' : undefined}
                {...(link.external ? { target: '_blank', rel: 'noopener' } : {})}
              >
                {link.label}
                {link.external && <span aria-hidden="true"> ↗</span>}
              </a>
            ))
          ) : (
            <Dropdown
              key={group.key}
              group={group as MandyNavGroup & { label: string }}
              open={openKey === group.key}
              setOpen={setOpenKey}
            />
          ),
        )}
      </div>
      <div className="md-nav__quick">
        <a className="md-nav__link" href="/games">Press Start!</a>
      </div>
      <ThemePicker initial={theme} />
      {isHome && <div className="md-progress" ref={progress} aria-hidden="true" />}
    </nav>
  );
}

export default MandyNav;
