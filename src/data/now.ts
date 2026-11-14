// When the /now page was last brought up to date. NowPage.tsx (modern),
// RetroNowPage.tsx (Web 1.0) and MandyNowPage.tsx all render it, so it lives here — otherwise one skin
// would keep claiming a date the other had moved on from.
//
// Bump this whenever you edit the /now content in any of the three components.
export const NOW_UPDATED = new Date('2026-11-14');
