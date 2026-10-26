/// <reference types="astro/client" />
/// <reference types="node" />

declare namespace App {
  interface Locals {
    /** Active skin for this request, resolved from the kk-skin cookie by middleware. */
    skin: import('./lib/skin').Skin;
    /** Active modern-skin theme, resolved from the kk-theme cookie by middleware. */
    theme: import('./lib/theme').Theme;
    /** Active Mandy-mode sub-theme, resolved from the kk-mandy-theme cookie by middleware. */
    mandyTheme: import('./lib/skin').MandyTheme;
    /** Visitor count shown by the retro hit counter (0 when the skin is modern). */
    hits: number;
  }
}
