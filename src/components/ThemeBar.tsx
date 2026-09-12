import { useEffect, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { flushSync } from "react-dom";
import { parseTheme } from "../lib/theme";
import type { Theme } from "../lib/theme";
import { requestTheme, THEME_CHANGE_EVENT } from "../lib/themeTransition";

const THEMES: { name: Theme; label: string; swatch: string; icon?: ReactNode }[] = [
  { name: "dark", label: "Dark theme", swatch: "bg-blue-600 border" },
  { name: "forest", label: "Forest theme", swatch: "bg-green-600 border" },
  {
    name: "light",
    label: "Light theme",
    swatch: "bg-white border border-gray-300 flex items-center justify-center overflow-hidden",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-yellow-500 fill-current">
        <path d="M12 4.5a1 1 0 0 1-1-1V2a1 1 0 1 1 2 0v1.5a1 1 0 0 1-1 1Zm0 15a1 1 0 0 1 1 1V22a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1ZM4.5 12a1 1 0 0 1-1 1H2a1 1 0 1 1 0-2h1.5a1 1 0 0 1 1 1Zm15 0a1 1 0 0 1 1-1H22a1 1 0 1 1 0 2h-1.5a1 1 0 0 1-1-1ZM6.34 6.34a1 1 0 0 1-1.41 0L3.87 5.28a1 1 0 0 1 1.41-1.41l1.06 1.06a1 1 0 0 1 0 1.41Zm12.73 12.73a1 1 0 0 1-1.41 0l-1.06-1.06a1 1 0 0 1 1.41-1.41l1.06 1.06a1 1 0 0 1 0 1.41ZM6.34 17.66a1 1 0 0 1 0 1.41l-1.06 1.06a1 1 0 0 1-1.41-1.41l1.06-1.06a1 1 0 0 1 1.41 0ZM19.07 4.93a1 1 0 0 1 0 1.41l-1.06 1.06a1 1 0 1 1-1.41-1.41l1.06-1.06a1 1 0 0 1 1.41 0ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" />
      </svg>
    ),
  },
  {
    name: "spider-man",
    label: "Spider-Man theme",
    swatch: "bg-[#2B3990] border border-red-700 flex items-center justify-center overflow-hidden",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        {/* mask */}
        <circle cx="12" cy="12" r="11" fill="#DF1F2D" />
        {/* webbing */}
        <g stroke="#450A0A" strokeWidth="0.7" fill="none">
          <path d="M12 11 L12 1 M12 11 L4.5 3 M12 11 L19.5 3 M12 11 L1 11 M12 11 L23 11 M12 11 L5 20.5 M12 11 L19 20.5 M12 11 L12 23" />
          <circle cx="12" cy="11" r="4.5" />
          <circle cx="12" cy="11" r="8" />
        </g>
        {/* eyes */}
        <path
          d="M3.6,9.8 C5.4,6.4 9.4,7.0 10.8,9.0 C11.0,12.8 8.6,15.2 6.0,14.4 C4.4,13.4 3.4,11.4 3.6,9.8 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="0.8"
        />
        <path
          d="M20.4,9.8 C18.6,6.4 14.6,7.0 13.2,9.0 C13.0,12.8 15.4,15.2 18.0,14.4 C19.6,13.4 20.6,11.4 20.4,9.8 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="0.8"
        />
      </svg>
    ),
  },
  {
    name: "batman",
    label: "Batman theme",
    swatch: "bg-black border border-yellow-500 flex items-center justify-center overflow-hidden",
    icon: (
      <svg viewBox="90 50 420 220" className="w-5 h-5 text-yellow-500 fill-current">
        <path d="M 212,220 C 197,171 156,153 123,221 109,157 120,109 159,63.6 190,114 234,115 254,89.8 260,82.3 268,69.6 270,60.3 273,66.5 275,71.6 280,75.6 286,79.5 294,79.8 300,79.8 306,79.8 314,79.5 320,75.6 325,71.6 327,66.5 330,60.3 332,69.6 340,82.3 346,89.8 366,115 410,114 441,63.6 480,109 491,157 477,221 444,153 403,171 388,220 366,188 316,200 300,248 284,200 234,188 212,220 Z" />
      </svg>
    ),
  },
];

export function ThemeBar() {
  const [current, setCurrent] = useState<Theme | null>(null);

  useEffect(() => {
    // Follow the displayed theme, including cookie restores and palette changes.
    const root = document.documentElement;
    const sync = () => setCurrent(parseTheme(root.getAttribute("data-theme")));
    // The shared coordinator commits both colours and the selected swatch
    // before the browser takes its new snapshot, including palette requests.
    const onThemeChange = () => flushSync(sync);
    sync();
    root.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    const observer = new window.MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      observer.disconnect();
      root.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
    };
  }, []);

  function applyTheme(theme: Theme, event: MouseEvent<HTMLButtonElement>) {
    // Circular reveal expanding from the clicked swatch (works for keyboard
    // activation too, since it uses the button's position rather than the cursor)
    const rect = event.currentTarget.getBoundingClientRect();
    requestTheme(theme, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {/* Command palette trigger — handled by CommandPalette's delegated
          [data-palette-trigger] listener; kept here so it always sits left
          of the first theme swatch */}
      <button
        type="button"
        data-palette-trigger
        className="h-6 flex items-center gap-1 rounded-full border border-base-content/20 bg-base-100/60 px-2 text-xs text-base-content/60 hover:text-base-content hover:border-base-content/40 transition-colors"
        aria-label="Open command palette"
        title="Ctrl+K / ⌘K"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="9" cy="9" r="6" />
          <path d="m14 14 4 4" strokeLinecap="round" />
        </svg>
        <kbd className="hidden sm:inline font-sans">⌘K</kbd>
      </button>
      {THEMES.map(({ name, label, swatch, icon }) => (
        <button
          key={name}
          className={`w-6 h-6 rounded-full transition-transform duration-200 hover:scale-110 ${swatch} ${
            current === name
              ? "scale-110 ring-2 ring-base-content/70 ring-offset-2 ring-offset-base-100"
              : ""
          }`}
          aria-label={label}
          aria-pressed={current === name}
          onClick={(event) => applyTheme(name, event)}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

export default ThemeBar;
