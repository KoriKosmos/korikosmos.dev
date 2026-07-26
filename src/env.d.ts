/// <reference types="astro/client" />
/// <reference types="node" />

declare namespace App {
  interface Locals {
    /** Active skin for this request, resolved from the kk-skin cookie by middleware. */
    skin: import('./lib/skin').Skin;
    /** Visitor count shown by the retro hit counter (0 when the skin is modern). */
    hits: number;
  }
}
