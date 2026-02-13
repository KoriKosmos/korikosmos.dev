/**
 * Get the best available image URL from a Last.fm image array.
 * Filters out Last.fm's default placeholder image.
 */
export function getBestImage(images: { '#text': string; size: string }[]): string {
  if (!Array.isArray(images)) return '';
  const sizes = ['extralarge', 'large', 'medium', 'small'];
  for (const size of sizes) {
    const img = images.find((i) => i.size === size);
    if (img && img['#text']) {
      // Filter out Last.fm's default placeholder image
      if (img['#text'].includes('2a96cbd8b46e442fc41c2b86b821562f')) return '';
      return img['#text'];
    }
  }
  return '';
}
