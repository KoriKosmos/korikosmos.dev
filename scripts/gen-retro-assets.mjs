#!/usr/bin/env node
/**
 * Generates every graphic the retro skin uses into public/retro/.
 *
 * Why generate instead of collect: the webcore look is built out of animated
 * GIFs, blinkies, and 88×31 buttons, and the authentic ones are other people's
 * work with no clear licence. These are drawn from scratch as SVG — nothing is
 * downloaded, nothing is hotlinked, and animation comes from CSS embedded in
 * each file (which does run inside an <img>, unlike external stylesheets).
 *
 * Output is committed, so the build never depends on this script. Re-run with
 * `npm run gen:retro` after editing.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('./public/retro');

const svg = (w, h, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"${extra}>${body}</svg>\n`;

/** Embedded CSS — animations declared this way play when the SVG is an <img>. */
const style = (css) => `<style>${css.replace(/\s+/g, ' ').trim()}</style>`;

const files = new Map();
const emit = (relPath, contents) => files.set(relPath, contents);

/* ===========================================================================
   Tiled backgrounds — small, seamless, repeat via CSS background-repeat
   =========================================================================== */

emit(
  'tiles/hearts.svg',
  svg(
    40,
    40,
    `<rect width="40" height="40" fill="#ffe9f4"/>
     <g fill="#ffc7e0">
       <path d="M10 16 A4 4 0 0 1 18 16 A4 4 0 0 1 26 16 Q26 21 18 27 Q10 21 10 16 Z" transform="translate(-8,-6) scale(0.55)"/>
       <path d="M10 16 A4 4 0 0 1 18 16 A4 4 0 0 1 26 16 Q26 21 18 27 Q10 21 10 16 Z" transform="translate(12,14) scale(0.55)"/>
     </g>
     <g fill="#ffb0d4">
       <circle cx="32" cy="8" r="1.6"/><circle cx="6" cy="30" r="1.6"/>
     </g>`,
  ),
);

emit(
  'tiles/stars.svg',
  svg(
    64,
    64,
    `<rect width="64" height="64" fill="#000018"/>
     <g fill="#ffffff">
       <circle cx="8" cy="12" r="1"/><circle cx="44" cy="6" r="0.8"/>
       <circle cx="26" cy="30" r="1.2"/><circle cx="58" cy="38" r="0.9"/>
       <circle cx="14" cy="52" r="1"/><circle cx="38" cy="58" r="0.7"/>
       <circle cx="52" cy="20" r="0.6"/><circle cx="4" cy="40" r="0.7"/>
     </g>
     <g fill="#9ad0ff">
       <circle cx="34" cy="16" r="0.9"/><circle cx="20" cy="44" r="0.8"/>
     </g>
     <path d="M46 44 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 Z" fill="#ffff88"/>`,
  ),
);

emit(
  'tiles/matrix.svg',
  svg(
    36,
    48,
    `<rect width="36" height="48" fill="#030b05"/>
     <g font-family="monospace" font-size="9">
       <text x="3" y="10" fill="#0f5c2c">1</text>
       <text x="15" y="20" fill="#0a3d1d">0</text>
       <text x="27" y="14" fill="#12683a">1</text>
       <text x="26" y="32" fill="#0f5c2c">1</text>
       <text x="6" y="40" fill="#0a3d1d">0</text>
       <text x="16" y="46" fill="#0d4a24">1</text>
     </g>`,
  ),
);

emit(
  'tiles/chrome.svg',
  svg(
    24,
    24,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
       <stop offset="0%" stop-color="#cbd4e4"/><stop offset="50%" stop-color="#aab6cc"/>
       <stop offset="100%" stop-color="#c6cfe0"/>
     </linearGradient></defs>
     <rect width="24" height="24" fill="url(#g)"/>
     <path d="M0 24 L24 0" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1"/>
     <path d="M0 12 L12 0 M12 24 L24 12" stroke="#8894ac" stroke-opacity="0.4" stroke-width="1"/>`,
  ),
);

/* ===========================================================================
   Dividers & bullets
   =========================================================================== */

emit(
  'gfx/rainbow-bar.svg',
  svg(
    120,
    12,
    `${style(`
      .b { animation: slide 3s linear infinite; }
      @keyframes slide { to { transform: translateX(-60px); } }
    `)}
     <defs><linearGradient id="r" x1="0" x2="1">
       <stop offset="0%" stop-color="#ff0000"/><stop offset="16%" stop-color="#ff8c00"/>
       <stop offset="33%" stop-color="#ffd700"/><stop offset="50%" stop-color="#00c853"/>
       <stop offset="66%" stop-color="#00b0ff"/><stop offset="83%" stop-color="#7c4dff"/>
       <stop offset="100%" stop-color="#ff0000"/>
     </linearGradient></defs>
     <g class="b"><rect x="-60" width="240" height="12" fill="url(#r)"/></g>`,
  ),
);

emit(
  'gfx/star-divider.svg',
  svg(
    28,
    14,
    `${style(`
      .s { animation: tw 1.6s ease-in-out infinite; transform-origin: 14px 7px; }
      @keyframes tw { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
    `)}
     <path class="s" d="M14 1 L16.2 5.6 L21.4 6.3 L17.7 10 L18.6 15 L14 12.6 L9.4 15 L10.3 10 L6.6 6.3 L11.8 5.6 Z" fill="#ffd700" stroke="#c89b00" stroke-width="0.6"/>`,
  ),
);

emit(
  'gfx/heart-divider.svg',
  svg(
    26,
    14,
    `${style(`
      .h { animation: beat 1.4s ease-in-out infinite; transform-origin: 13px 8px; }
      @keyframes beat { 0%,100% { transform: scale(1); } 40% { transform: scale(1.18); } }
    `)}
     <path class="h" d="M13 13 Q4 7.5 4 4.6 A3 3 0 0 1 13 3.4 A3 3 0 0 1 22 4.6 Q22 7.5 13 13 Z" fill="#ff4f9e" stroke="#c1005f" stroke-width="0.7"/>`,
  ),
);

emit(
  'gfx/bullet.svg',
  svg(
    11,
    11,
    `<circle cx="5.5" cy="5.5" r="4.5" fill="#ff4f9e" stroke="#8c0044" stroke-width="1"/>
     <circle cx="4" cy="4" r="1.4" fill="#ffffff" fill-opacity="0.8"/>`,
  ),
);

emit(
  'gfx/sparkle.svg',
  svg(
    14,
    14,
    `<path d="M7 0 L8.4 5.6 L14 7 L8.4 8.4 L7 14 L5.6 8.4 L0 7 L5.6 5.6 Z" fill="#fff3a8" stroke="#ffd24a" stroke-width="0.6"/>`,
  ),
);

/* ===========================================================================
   Animated "GIF" set

   Note: anything with a text label gets an opaque plate behind it. These are
   drawn on --rt-panel, which is near-white in the kawaii/y2k themes and
   near-black in geocities/cyber, so bare dark text vanishes in half of them.
   (Keep explanations here, not in the emitted SVG — an XML comment may not
   contain a double hyphen, so a CSS custom property name inside one is a
   parse error.)
   =========================================================================== */

emit(
  'gfx/construction.svg',
  svg(
    180,
    60,
    `${style(`
      .flash { animation: f 0.9s steps(1,end) infinite; }
      @keyframes f { 0%,49% { opacity: 1; } 50%,100% { opacity: 0.15; } }
      .stripes { animation: roll 1.4s linear infinite; }
      @keyframes roll { to { transform: translateX(-24px); } }
    `)}
     <clipPath id="bar"><rect x="6" y="20" width="168" height="20"/></clipPath>
     <g clip-path="url(#bar)">
       <g class="stripes">
         ${Array.from({ length: 10 }, (_, i) => `<path d="M${-24 + i * 24} 40 L${-12 + i * 24} 20 L${0 + i * 24} 20 L${-12 + i * 24} 40 Z" fill="#ffb400"/>`).join('')}
         <rect x="-24" y="20" width="216" height="20" fill="#111111" opacity="0.001"/>
       </g>
     </g>
     <rect x="6" y="20" width="168" height="20" fill="none" stroke="#111111" stroke-width="2"/>
     <rect x="6" y="20" width="168" height="20" fill="#111111" opacity="0.08"/>
     <circle class="flash" cx="14" cy="12" r="5" fill="#ff3b30" stroke="#8c0000" stroke-width="1.5"/>
     <circle class="flash" cx="166" cy="12" r="5" fill="#ff3b30" stroke="#8c0000" stroke-width="1.5" style="animation-delay:.45s"/>
     <rect x="12" y="44" width="156" height="15" fill="#111111"/>
     <text x="90" y="55.5" text-anchor="middle" font-family="Verdana,sans-serif" font-size="10" font-weight="bold" fill="#ffb400">UNDER CONSTRUCTION</text>`,
  ),
);

emit(
  'gfx/new.svg',
  svg(
    36,
    16,
    `${style(`
      .n { animation: p 0.8s steps(1,end) infinite; }
      @keyframes p { 0%,49% { fill: #ff0000; } 50%,100% { fill: #ffe600; } }
    `)}
     <rect width="36" height="16" rx="2" fill="#000000"/>
     <text class="n" x="18" y="12" text-anchor="middle" font-family="Verdana,sans-serif" font-size="10" font-weight="bold">NEW!</text>`,
  ),
);

emit(
  'gfx/mail.svg',
  svg(
    32,
    24,
    `${style(`
      .lid { animation: flap 2.2s ease-in-out infinite; transform-origin: 16px 5px; }
      @keyframes flap { 0%,60%,100% { transform: rotateX(0deg); } 30% { transform: translateY(-3px); } }
    `)}
     <rect x="1" y="4" width="30" height="19" rx="1.5" fill="#ffffff" stroke="#333333" stroke-width="1.5"/>
     <path class="lid" d="M1.6 5 L16 15 L30.4 5" fill="none" stroke="#333333" stroke-width="1.5"/>
     <path d="M1.6 22 L11 13 M30.4 22 L21 13" stroke="#999999" stroke-width="1"/>
     <circle cx="27" cy="6" r="4" fill="#ff3b30"/>
     <text x="27" y="8.6" text-anchor="middle" font-family="Verdana,sans-serif" font-size="6" font-weight="bold" fill="#ffffff">1</text>`,
  ),
);

emit(
  'gfx/mascot.svg',
  svg(
    72,
    72,
    `${style(`
      .blink { animation: bl 4s steps(1,end) infinite; }
      @keyframes bl { 0%,94% { transform: scaleY(1); } 95%,100% { transform: scaleY(0.1); } }
      .float { animation: fl 3s ease-in-out infinite; }
      @keyframes fl { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
      .tail { animation: tw 1.8s ease-in-out infinite; transform-origin: 58px 54px; }
      @keyframes tw { 0%,100% { transform: rotate(-8deg); } 50% { transform: rotate(14deg); } }
    `)}
     <g class="float">
       <path class="tail" d="M56 54 q12 -2 10 -14" stroke="#6b4a5c" stroke-width="5" fill="none" stroke-linecap="round"/>
       <ellipse cx="36" cy="46" rx="22" ry="18" fill="#ffd9ea" stroke="#6b4a5c" stroke-width="2.5"/>
       <path d="M18 30 L16 14 L30 22 Z" fill="#ffd9ea" stroke="#6b4a5c" stroke-width="2.5" stroke-linejoin="round"/>
       <path d="M54 30 L56 14 L42 22 Z" fill="#ffd9ea" stroke="#6b4a5c" stroke-width="2.5" stroke-linejoin="round"/>
       <g class="blink" style="transform-origin:26px 42px"><ellipse cx="26" cy="42" rx="3.2" ry="4" fill="#3a2230"/></g>
       <g class="blink" style="transform-origin:46px 42px"><ellipse cx="46" cy="42" rx="3.2" ry="4" fill="#3a2230"/></g>
       <circle cx="27.4" cy="40.6" r="1.1" fill="#ffffff"/>
       <circle cx="47.4" cy="40.6" r="1.1" fill="#ffffff"/>
       <path d="M33 50 q3 3 6 0" stroke="#3a2230" stroke-width="2" fill="none" stroke-linecap="round"/>
       <ellipse cx="17" cy="49" rx="4" ry="2.6" fill="#ff9ec4" opacity="0.75"/>
       <ellipse cx="55" cy="49" rx="4" ry="2.6" fill="#ff9ec4" opacity="0.75"/>
     </g>`,
  ),
);

emit(
  'gfx/award.svg',
  svg(
    120,
    48,
    `${style(`
      .shine { animation: sh 2.6s ease-in-out infinite; }
      @keyframes sh { 0%,100% { opacity: 0.15; } 50% { opacity: 0.6; } }
    `)}
     <rect x="1" y="1" width="118" height="46" rx="3" fill="#2b1a3d" stroke="#ffd700" stroke-width="2"/>
     <circle cx="24" cy="24" r="13" fill="#ffd700" stroke="#a67c00" stroke-width="1.5"/>
     <path d="M24 15 L26.6 21 L33 21.6 L28.2 25.8 L29.6 32 L24 28.8 L18.4 32 L19.8 25.8 L15 21.6 L21.4 21 Z" fill="#fff3b0"/>
     <path d="M19 34 L17 45 L24 41 L31 45 L29 34 Z" fill="#c1005f"/>
     <text x="72" y="20" text-anchor="middle" font-family="Verdana,sans-serif" font-size="9" font-weight="bold" fill="#ffd700">COOL SITE</text>
     <text x="72" y="32" text-anchor="middle" font-family="Verdana,sans-serif" font-size="7" fill="#ffffff">OF THE DAY</text>
     <rect class="shine" x="40" y="1" width="20" height="46" fill="#ffffff"/>`,
  ),
);

emit(
  'gfx/webring.svg',
  svg(
    72,
    28,
    `${style(`
      .spin { animation: sp 6s linear infinite; transform-origin: 14px 14px; }
      @keyframes sp { to { transform: rotate(360deg); } }
    `)}
     <rect width="72" height="28" rx="2" fill="#0b1020"/>
     <circle class="spin" cx="14" cy="14" r="8" fill="none" stroke="#00b0ff" stroke-width="3" stroke-dasharray="6 4"/>
     <text x="46" y="12" text-anchor="middle" font-family="Verdana,sans-serif" font-size="8" font-weight="bold" fill="#66ccff">WEB</text>
     <text x="46" y="22" text-anchor="middle" font-family="Verdana,sans-serif" font-size="8" font-weight="bold" fill="#c0a8ff">RING</text>`,
  ),
);

/* ===========================================================================
   88×31 buttons
   =========================================================================== */

/**
 * @param {{file:string, bg:string, bg2:string, ink:string, chipBg:string,
 *          chip:string, chipInk:string, line1:string, line2:string}} spec
 */
function button(spec) {
  const { file, bg, bg2, ink, chipBg, chip, chipInk, line1, line2 } = spec;
  emit(
    `buttons/${file}.svg`,
    svg(
      88,
      31,
      `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="${bg2}"/>
       </linearGradient></defs>
       <rect width="88" height="31" fill="url(#bg)"/>
       <rect x="0.5" y="0.5" width="87" height="30" fill="none" stroke="#000000"/>
       <rect x="1.5" y="1.5" width="85" height="28" fill="none" stroke="#ffffff" stroke-opacity="0.35"/>
       <rect x="2" y="2" width="24" height="27" fill="${chipBg}"/>
       <text x="14" y="20" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="12" font-weight="bold" fill="${chipInk}">${chip}</text>
       <text x="57" y="14" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="7.5" font-weight="bold" fill="${ink}">${line1}</text>
       <text x="57" y="24" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="7" fill="${ink}">${line2}</text>`,
      ' shape-rendering="crispEdges"',
    ),
  );
}

[
  { file: 'korikosmos', bg: '#ff4f9e', bg2: '#a02060', ink: '#ffffff', chipBg: '#2b0d1c', chip: '♥', chipInk: '#ff8ec4', line1: 'KORIKOSMOS', line2: '.dev' },
  { file: 'netscape', bg: '#3a3a8c', bg2: '#141440', ink: '#ffffff', chipBg: '#000000', chip: 'N', chipInk: '#66ccff', line1: 'BEST VIEWED IN', line2: 'NETSCAPE 4.0' },
  { file: 'notepad', bg: '#e8e8e8', bg2: '#b0b0b0', ink: '#101010', chipBg: '#ffffff', chip: '✎', chipInk: '#202020', line1: 'MADE WITH', line2: 'NOTEPAD' },
  { file: 'astro', bg: '#20124d', bg2: '#0a0620', ink: '#ffffff', chipBg: '#ff5d01', chip: '▲', chipInk: '#ffffff', line1: 'POWERED BY', line2: 'ASTRO' },
  { file: 'validcss', bg: '#0055aa', bg2: '#002d5c', ink: '#ffffff', chipBg: '#ffffff', chip: '✓', chipInk: '#0055aa', line1: 'VALID CSS!', line2: 'probably' },
  { file: 'resolution', bg: '#333333', bg2: '#111111', ink: '#00ff66', chipBg: '#000000', chip: '▣', chipInk: '#00ff66', line1: 'BEST VIEWED AT', line2: '1024 x 768' },
  { file: 'linux', bg: '#1a1a1a', bg2: '#000000', ink: '#ffcc00', chipBg: '#ffcc00', chip: '⚙', chipInk: '#000000', line1: 'RUNS ON', line2: 'LINUX' },
  { file: 'selfhosted', bg: '#0d3d2c', bg2: '#04180f', ink: '#7fffd4', chipBg: '#000000', chip: '☁', chipInk: '#7fffd4', line1: 'SELF', line2: 'HOSTED' },
  { file: 'lastfm', bg: '#b90000', bg2: '#5c0000', ink: '#ffffff', chipBg: '#000000', chip: '♪', chipInk: '#ff5555', line1: 'SCROBBLING', line2: 'SINCE FOREVER' },
  { file: 'oneko', bg: '#ffe0b3', bg2: '#d9a066', ink: '#3a2210', chipBg: '#3a2210', chip: '⌂', chipInk: '#ffe0b3', line1: 'ONEKO', line2: 'APPROVED' },
  { file: 'tetris', bg: '#101040', bg2: '#000018', ink: '#00e5ff', chipBg: '#000000', chip: '▦', chipInk: '#ffe600', line1: 'BLOCK', line2: 'STACKER' },
  { file: 'nojs', bg: '#2d2d2d', bg2: '#0f0f0f', ink: '#ffffff', chipBg: '#f7df1e', chip: 'JS', chipInk: '#000000', line1: 'DEGRADES', line2: 'GRACEFULLY' },
  { file: 'guestbook', bg: '#7c4dff', bg2: '#3a1d99', ink: '#ffffff', chipBg: '#ffffff', chip: '✍', chipInk: '#3a1d99', line1: 'SIGN MY', line2: 'GUESTBOOK' },
  { file: 'openweb', bg: '#004d40', bg2: '#00251f', ink: '#7fffd4', chipBg: '#7fffd4', chip: '⌘', chipInk: '#004d40', line1: 'KEEP THE WEB', line2: 'WEIRD' },
].forEach(button);

/* ===========================================================================
   Blinkies — 150×20 animated bars
   =========================================================================== */

/** @param {{file:string, bg:string, ink:string, ink2:string, text:string}} spec */
function blinkie({ file, bg, ink, ink2, text }) {
  emit(
    `blinkies/${file}.svg`,
    svg(
      150,
      20,
      `${style(`
        .t { animation: c 0.7s steps(1,end) infinite; }
        @keyframes c { 0%,49% { fill: ${ink}; } 50%,100% { fill: ${ink2}; } }
        .d { animation: d 1.2s linear infinite; }
        @keyframes d { to { stroke-dashoffset: -16; } }
      `)}
       <rect width="150" height="20" fill="${bg}"/>
       <rect class="d" x="1" y="1" width="148" height="18" fill="none" stroke="${ink2}" stroke-width="2" stroke-dasharray="4 4"/>
       <text class="t" x="75" y="14" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="9" font-weight="bold">${text}</text>`,
      ' shape-rendering="crispEdges"',
    ),
  );
}

[
  { file: 'welcome', bg: '#1a0033', ink: '#ff66cc', ink2: '#66ffff', text: '✦ WELCOME TO MY SITE ✦' },
  { file: 'guestbook', bg: '#2b0d1c', ink: '#ffd700', ink2: '#ff4f9e', text: 'PLEASE SIGN MY GUESTBOOK' },
  { file: 'construction', bg: '#000000', ink: '#ffb400', ink2: '#ff3b30', text: '⚠ UNDER CONSTRUCTION ⚠' },
  { file: 'email', bg: '#001a33', ink: '#66ccff', ink2: '#ffffff', text: '✉ EMAIL ME ✉' },
  { file: 'kawaii', bg: '#3d0022', ink: '#ff9ec4', ink2: '#fff3a8', text: '(╰◕‿◕╯) KAWAII' },
  { file: 'nowplaying', bg: '#0d0d0d', ink: '#00ff66', ink2: '#ffff00', text: '♫ NOW PLAYING ♫' },
].forEach(blinkie);

/* ===========================================================================
   Write everything
   =========================================================================== */

// Write in place and prune what's no longer generated, rather than removing
// public/retro/ wholesale: deleting the directory out from under a running
// `astro dev` makes it 404 every asset until the server is restarted.
for (const [relPath, contents] of files) {
  const target = path.join(OUT, relPath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, contents, 'utf-8');
}

let pruned = 0;
async function prune(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await prune(full);
      continue;
    }
    if (!files.has(path.relative(OUT, full))) {
      await fs.rm(full);
      pruned++;
    }
  }
}
await prune(OUT);

console.log(`Wrote ${files.size} retro assets to public/retro/${pruned ? ` (pruned ${pruned} stale)` : ''}`);
