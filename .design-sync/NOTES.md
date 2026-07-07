# design-sync notes for korikosmos-dev

## Repo shape

- This is an Astro app, not a published npm package. `pkg`/`globalName` in
  config point at the app's own `package.json` (`korikosmos-dev`), resolved
  via a `node_modules/korikosmos-dev -> ..` symlink so the converter's
  default `node_modules/<pkg>` resolution finds the repo root without an
  `--entry` override. Recreate this symlink on a fresh clone:
  `ln -sfn .. node_modules/korikosmos-dev`.
- No build step ships a `dist/`; the converter always runs in synth-entry
  mode (`[NO_DIST]` is expected, not an error).
- CSS comes from compiling `src/styles/global.css` with the project's own
  Tailwind CLI (`cfg.buildCmd`) into `.design-sync/.cache/compiled.css` —
  re-run that command before `package-build.mjs` whenever Tailwind config or
  global.css changes; the cache file is gitignored.
- `ProjectCard`'s real prop type (`CollectionEntry<"projects">` from
  `astro:content`) isn't resolvable outside Astro's virtual module system —
  `cfg.dtsPropsFor.ProjectCard` hand-writes the shape instead. Keep it in
  sync with `src/content/config.ts`'s `projects` schema if that changes.
- Components originally used `export default function X()` only. Synth-entry
  mode emits `export * from "<file>"` per source file, which does NOT
  re-export `default` — all 4 components silently vanished from
  `window.KoriKosmos` until each file got a matching named export
  (`export function X() {...}; export default X;`). Keep both forms on any
  future component added to `src/components/`.

## Known render warns (triaged, not new)

- `OnekoToggle` and `ThemeBar` both render real fixed-position UI (`fixed
  bottom-4 right-4` / `fixed top-4 right-4`). Inside the preview card's
  `.ds-cell` wrapper (which applies `transform: translateZ(0)` +
  `overflow: hidden` for isolation), a CSS `transform` on an ancestor
  becomes the containing block for `position: fixed` descendants — so the
  buttons render somewhere outside the visible card bounds rather than in
  their real on-page corner. `cfg.overrides` sets `cardMode: "single"` for
  both, which fixes ThemeBar's capture (passes >5KB). OnekoToggle's capture
  still comes back as a single solid color (`[RENDER_BLANK]`, ~4.5KB) —
  confirmed via direct pixel inspection (one solid color, no JS errors,
  `rootEmpty: false`) that this is the same clipping artifact, not a real
  defect: the live dev server (`npm run dev`, SSR output checked directly)
  shows the same component hydrating and rendering correctly on the actual
  site. Accepted as a floor-card-adjacent limitation of previewing fixed
  page chrome in isolation.

## Re-sync risks

- `dtsPropsFor.ProjectCard` is hand-maintained and will silently drift if
  `src/content/config.ts`'s `projects` schema changes — no automated check
  ties them together.
- The `node_modules/korikosmos-dev` symlink is required infrastructure for
  every build/validate/resync run and is NOT committed (it's inside
  `node_modules/`) — re-create it after any fresh clone or `npm ci`.
- `ProjectCard`'s authored preview uses hand-written mock project objects
  (not real content-collection entries) since `astro:content` can't resolve
  outside Astro's build — if real project data changes shape, the preview
  mocks won't catch it.
- This sync covers only the 4 reusable components in `src/components/`, not
  the rest of the site (pages, API routes, `src/lib/*`) — by design, per the
  base skill's scope (React design systems only).
