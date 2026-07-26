// When the /now page was last brought up to date. Both NowPage.tsx (modern) and
// RetroNowPage.tsx (Web 1.0) render it, so it lives here — otherwise one skin
// would keep claiming a date the other had moved on from.
//
// Bump this whenever you edit the /now content in either component.
export const NOW_UPDATED = new Date('2026-07-08');
