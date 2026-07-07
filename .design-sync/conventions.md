## Setup

No provider or root wrapper is required — these components read `localStorage` and `document.documentElement` directly; there's no ThemeProvider/context to wrap. The active theme lives entirely in the `data-theme` attribute on `<html>`, set to one of `dark` (default), `light`, `forest`, or `batman`. `ThemeBar` writes `data-theme` + `localStorage.setItem("theme", …)` on click; if you build a screen that switches themes, set `data-theme` on the root element the same way rather than inventing a new mechanism.

## Styling idiom

This is a DaisyUI (Tailwind plugin) design system — style with DaisyUI's **semantic** color classes, not raw Tailwind colors, so components stay theme-aware across all 4 themes:

| Class | Use for |
|---|---|
| `bg-base-100` / `bg-base-200` | page background / card & surface background |
| `text-base-content` | default text color (and `/60`, `/70`, `/80` opacity variants for secondary text) |
| `bg-primary` / `text-primary-content` | primary CTAs and accents |
| `bg-secondary`, `bg-accent`, `bg-neutral` + their `-content` pairs | secondary/accent/neutral surfaces with correctly-contrasting text |
| `from-primary to-secondary` (with `bg-gradient-to-r`/`-br`) | gradient accent treatment used on hero/CTA blocks |
| `hover:bg-accent-dark` | a repo-specific darker hover state (custom utility, not stock DaisyUI) — only use for hover states that need to read as "darker accent" |

Buttons follow two fixed conventions: `bg-neutral text-neutral-content rounded` for utility/game controls, `bg-primary text-primary-content rounded` for primary CTAs. Don't use bare `bg-blue-600`/`bg-gray-800`-style raw colors — they break when the theme switches (the only exception is `ThemeBar`'s own swatches, which intentionally show each theme's literal color, not the active theme's colors).

## Where the truth lives

Read `styles.css` (and its `@import` of `_ds_bundle.css`) for the full compiled DaisyUI/Tailwind ruleset, including the 4 `[data-theme=…]` blocks that define every CSS variable (`--p`, `--b1`, `--b2`, `--bc`, etc.) these classes resolve against. Each component's `.prompt.md` documents its specific props.

## Example

```tsx
import { CvSection, ProjectCard } from 'korikosmos-dev';

<div className="space-y-8">
  <CvSection title="Experience">
    <p className="mb-2 text-base-content/80">Senior Engineer at Acme Corp.</p>
  </CvSection>
  <ProjectCard project={{ slug: 'demo', data: { title: 'Demo', summary: 'A sample project.' } }} />
</div>
```
