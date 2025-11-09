/**
 * Computes the distance between two points.
 * @param {{ x: number, y: number }} a The first point.
 * @param {{ x: number, y: number }} b The second point.
 * @returns {number} The Euclidean distance between points a and b.
 */
export function dist(a,b) {
  const dx=a.x-b.x, dy=a.y-b.y;
  return Math.hypot(dx,dy);
}

/**
 * Delay execution for a given amount of time.
 * @param {number} ms - The number of milliseconds to delay.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}