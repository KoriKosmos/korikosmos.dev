/**
 * The site's one bat emblem, a 20x7 pixel bat (hand-reduced from Maan's
 * braille-art bat). Used by the Mandy-mode nav mark, the Bat-Signal in the
 * gotham backdrop (as raw rows), the modern Batman theme swatch, and the
 * "Mandy mode" skin button — change it here and they all follow.
 *
 * Every row must be a palindrome, or the bat comes out a pixel lopsided.
 * Lives in page-components/ (not components/) to stay out of the
 * design-sync surface; ThemeBar just imports it.
 */
export const BAT_ROWS = [
  '#######.#..#.#######',
  '.######.####.######.',
  '..################..',
  '..################..',
  '......########......',
  '........####........',
  '.........##.........',
] as const;

export const BAT_W = BAT_ROWS[0].length;
export const BAT_H = BAT_ROWS.length;

// One rect per horizontal run of pixels.
const RUNS = BAT_ROWS.flatMap((row, y) => {
  const runs: { x: number; y: number; w: number }[] = [];
  for (let x = 0; x < row.length; ) {
    if (row[x] !== '#') { x++; continue; }
    let w = 0;
    while (row[x + w] === '#') w++;
    runs.push({ x, y, w });
    x += w;
  }
  return runs;
});

interface Props {
  /** CSS px per bat pixel. Keep it a whole number so the pixels stay crisp. */
  scale?: number;
  className?: string;
  /** Class on each pixel rect, for skins that colour via CSS (`fill`). */
  pixelClassName?: string;
}

/** Filled with `currentColor` unless a pixel class says otherwise. Decorative. */
export function PixelBat({ scale = 1, className, pixelClassName }: Props) {
  return (
    <svg
      viewBox={`0 0 ${BAT_W} ${BAT_H}`}
      width={BAT_W * scale}
      height={BAT_H * scale}
      shapeRendering="crispEdges"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {RUNS.map(({ x, y, w }) => (
        <rect key={`${x}-${y}`} className={pixelClassName} x={x} y={y} width={w} height={1} />
      ))}
    </svg>
  );
}

export default PixelBat;
