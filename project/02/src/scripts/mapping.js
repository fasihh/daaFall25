/**
 * computeMapping: map data coordinates to screen (pixel) coordinates
 * @param {Array<{ x: number, y: number, id: number }>} ptsIn
 * @param {number} cvsWidth Canvas width in pixels
 * @param {number} cvsHeight Canvas height in pixels
 * @param {number} pad Padding in pixels
 */
export function computeMapping(ptsIn, cvsWidth, cvsHeight, pad = 24) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  // find bounds
  for (const p of ptsIn) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  // handle case of all points identical
  if (minX === Infinity) {
    minX = 0; maxX = 1;
    minY = 0; maxY = 1;
  }
  // find scaling and mapped points
  const w = cvsWidth - pad * 2; const h = cvsHeight - pad * 2;
  const spanX = maxX - minX || 1; const spanY = maxY - minY || 1;
  const scale = Math.min(w / spanX, h / spanY);
  const mapped = ptsIn.map(p => ({
    id: p.id, ox: p.x, oy: p.y,
    x: pad + (p.x - minX) * scale + (w - spanX * scale) / 2,
    y: pad + (p.y - minY) * scale + (h - spanY * scale) / 2
  }));

  const idMap = new Map(mapped.map(m => [m.id, m]));

  // affine transform from data to screen coords
  const toScreen = (p) => ({
    x: pad + (p.x - minX) * scale + (w - spanX * scale) / 2,
    y: pad + (p.y - minY) * scale + (h - spanY * scale) / 2
  });

  // scale distance from data units to pixels
  const distanceToPixels = (d) => d * scale;

  // return mapped points pair from pair of ids
  function getMappedPair(pair) {
    if (!pair || !Array.isArray(pair)) return null;
    return pair.map(id => idMap.get(id) || null);
  }

  return {
    mapped,
    idMap,
    toScreen,
    distanceToPixels,
    getMappedPair,
    minX,
    maxX,
    minY,
    maxY,
    pad,
    scale
  };
}
