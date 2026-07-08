import { useEffect, useMemo, useRef, useState } from "react";
import { navigate } from "astro:transitions/client";

// Site-wide ⌘K / Ctrl-K launcher. Mounted once in Layout.astro with
// transition:persist; link items (pages, blog posts, projects) are built
// server-side in Layout frontmatter and passed as props. Theme actions are
// defined here. Opens via the shortcut or any element with a
// [data-palette-trigger] attribute (event delegation, so the header button
// keeps working after ClientRouter swaps).

export interface PaletteLink {
  label: string;
  href: string;
  section: string;
  /** Extra text to match against when searching, e.g. a post description. */
  keywords?: string;
}

interface PaletteAction {
  label: string;
  section: string;
  keywords?: string;
  href?: string;
  perform?: () => void;
}

const THEMES: { name: string; label: string }[] = [
  { name: "dark", label: "Dark" },
  { name: "light", label: "Light" },
  { name: "forest", label: "Forest" },
  { name: "batman", label: "Batman" },
];

function applyTheme(name: string) {
  const root = document.documentElement;
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.setAttribute("data-theme-fade", "");
    window.setTimeout(() => root.removeAttribute("data-theme-fade"), 400);
  }
  root.setAttribute("data-theme", name);
  localStorage.setItem("theme", name);
}

/**
 * Subsequence fuzzy match. Returns a relevance score, or null if `query`
 * isn't a subsequence of `text`. Consecutive matches and word starts score
 * higher, so "rps" beats scattered letters and "tet" ranks Tetris first.
 */
function fuzzyScore(query: string, text: string): number | null {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 0;
  const substringAt = t.indexOf(q);
  if (substringAt >= 0) return 100 - substringAt;
  let score = 0;
  let ti = 0;
  let lastMatch = -2;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return null;
    if (found === 0 || t[found - 1] === " " || t[found - 1] === "-") score += 3;
    else if (found === lastMatch + 1) score += 2;
    else score += 1;
    lastMatch = found;
    ti = found + 1;
  }
  return score;
}

export function CommandPalette({ links }: { links: PaletteLink[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const actions = useMemo<PaletteAction[]>(
    () => [
      ...links,
      ...THEMES.map(theme => ({
        label: `Theme: ${theme.label}`,
        section: "Themes",
        keywords: `theme ${theme.name} switch appearance`,
        perform: () => applyTheme(theme.name),
      })),
    ],
    [links],
  );

  const results = useMemo(() => {
    return actions
      .map(action => ({
        action,
        score: fuzzyScore(query, `${action.label} ${action.keywords ?? ""}`),
      }))
      .filter((r): r is { action: PaletteAction; score: number } => r.score !== null)
      .sort((a, b) => b.score - a.score)
      .map(r => r.action);
  }, [actions, query]);

  function show() {
    setQuery("");
    setSelected(0);
    setOpen(true);
    dialogRef.current?.showModal();
    inputRef.current?.focus();
  }

  function hide() {
    dialogRef.current?.close();
  }

  function run(action: PaletteAction) {
    hide();
    if (action.perform) action.perform();
    else if (action.href) navigate(action.href);
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialogRef.current?.open) hide();
        else show();
      }
    };
    // Delegated so header trigger buttons re-rendered by navigation still work
    const onClick = (e: Event) => {
      if ((e.target as Element).closest?.("[data-palette-trigger]")) show();
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${selected}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selected, results]);

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected(s => (s + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected(s => (s - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selected]) run(results[selected]);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-0 p-0 w-full max-w-full h-full max-h-full bg-transparent backdrop:bg-black/50"
      onClose={() => setOpen(false)}
      onClick={e => {
        if (e.target === dialogRef.current) hide();
      }}
      aria-label="Command palette"
    >
      <div className="mx-auto mt-[15vh] w-[min(36rem,calc(100vw-2rem))] rounded-xl bg-base-200 text-base-content shadow-2xl border border-base-content/10 overflow-hidden">
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search pages, posts, projects, themes…"
          className="w-full bg-transparent px-4 py-3 text-lg outline-none border-b border-base-content/10 placeholder:text-base-content/40"
          onChange={e => {
            setQuery(e.target.value);
            setSelected(0);
          }}
          onKeyDown={onInputKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls="palette-results"
          aria-activedescendant={results[selected] ? `palette-option-${selected}` : undefined}
        />
        <ul ref={listRef} id="palette-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-4 text-base-content/50">No results for “{query}”</li>
          )}
          {results.map((action, i) => (
            <li key={`${action.section}-${action.label}`} role="option" aria-selected={i === selected} id={`palette-option-${i}`}>
              <button
                data-index={i}
                className={`w-full flex items-center justify-between gap-4 rounded-lg px-3 py-2 text-left ${
                  i === selected ? "bg-primary text-primary-content" : ""
                }`}
                onMouseMove={() => setSelected(i)}
                onClick={() => run(action)}
              >
                <span className="truncate">{action.label}</span>
                <span className={`shrink-0 text-xs ${i === selected ? "opacity-80" : "text-base-content/40"}`}>
                  {action.section}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}

export default CommandPalette;
