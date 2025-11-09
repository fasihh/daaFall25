import { delay } from './utils.js';
import { computeMapping } from './mapping.js';

/**
 * Creates a drawing function for the given canvas and mapped points.
 * @param {HTMLCanvasElement} cvs The canvas element to draw on.
 * @param {Array<{ x: number, y: number, id: number }>} mapped The array of mapped points.
 * @param {function} mapping The mapping parameters.
 */
function makeDrawer(cvs, mapped, mapping, R = 6) {
  const ctx = cvs.getContext('2d');
  // helper: normalize a point (either mapped pixel point or original data point)
  function screenOf(p) {
    if (!p) return null;
    // mapped points produced by computeMapping have 'ox' and 'oy'
    if (p.ox !== undefined) return { x: p.x, y: p.y };
    // otherwise assume this is a data point with x/y in data units
    return mapping.toScreen(p);
  }

  return function draw(state = {}) {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    const { pad } = mapping;
    // left / right shading
    if (state.leftRegion) { ctx.fillStyle = 'rgba(80,120,255,0.04)'; ctx.fillRect(0, 0, state.leftRegion, cvs.height); }
    if (state.rightRegion) { ctx.fillStyle = 'rgba(255,120,120,0.03)'; ctx.fillRect(state.rightRegion, 0, cvs.width - state.rightRegion, cvs.height); }
    // crossover region
    if (state.region) {
      const l = state.region.left; const r = state.region.right;
      ctx.fillStyle = 'rgba(255,127,80,0.12)'; ctx.fillRect(l, 0, Math.max(0, r - l), cvs.height);
      ctx.strokeStyle = 'rgba(255,127,80,0.28)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(l, 0); ctx.lineTo(l, cvs.height); ctx.moveTo(r, 0); ctx.lineTo(r, cvs.height); ctx.stroke();
    }
    // subdomain highlight
    if (state.subdomain) {
      const l = Math.max(pad, state.subdomain.left);
      const r = Math.min(cvs.width - pad, state.subdomain.right);
      ctx.fillStyle = 'rgba(80,200,120,0.06)'; ctx.fillRect(l, 0, Math.max(0, r - l), cvs.height);
      ctx.strokeStyle = 'rgba(80,180,120,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(l, 0); ctx.lineTo(l, cvs.height); ctx.moveTo(r, 0); ctx.lineTo(r, cvs.height); ctx.stroke();
      if (state.subdomain.points && state.subdomain.points.length) {
        for (const p of state.subdomain.points) { ctx.beginPath(); ctx.strokeStyle = 'rgba(30,120,60,0.9)'; ctx.lineWidth = 2; ctx.arc(p.x, p.y, R + 3, 0, Math.PI * 2); ctx.stroke(); }
      }
    }
    // midline
    if (state.midx != null) { ctx.strokeStyle = 'rgba(100,200,255,0.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(state.midx, 0); ctx.lineTo(state.midx, cvs.height); ctx.stroke(); }
    // strip (state.strip items may be mapped or data points)
    if (state.strip && state.strip.length) {
      ctx.fillStyle = 'rgba(255,200,0,0.06)';
      for (const p of state.strip) {
        const s = screenOf(p);
        if (s) ctx.fillRect(s.x - 10, s.y - 10, 20, 20);
      }
    }
    // compare
    if (state.compare) {
      const a = screenOf(state.compare.a), b = screenOf(state.compare.b);
      if (a && b) { ctx.strokeStyle = 'lightcoral'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    // best
    if (state.best) {
      const a = screenOf(state.best[0]), b = screenOf(state.best[1]);
      if (a && b) { ctx.strokeStyle = '#c33'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    // points
    for (const p of mapped) { ctx.fillStyle = '#cdb4ff'; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#222'; ctx.font = '10px monospace'; }
  };
}

/**
 * Executes the closest pair algorithm with tracing.
 * @param {Array<{ x: number, y: number, id: number }>} origPoints The original array of points.
 * @returns {{ trace: Array<object>, best: { d: number, pair: Array<number> } }} The trace of the algorithm and the best pair found (pair are point ids, d in data units).
 */
function closestPairTrace(origPoints) {
  const trace = [];
  if (origPoints.length < 2) {
    return {
      trace,
      best: { d: Infinity, pair: null }
    };
  }
  const ptsCopy = origPoints.map(p => ({ x: p.x, y: p.y, id: p.id }));
  const px = ptsCopy.slice().sort((a, b) => a.x - b.x);
  const py = ptsCopy.slice().sort((a, b) => a.y - b.y);

  function rec(px, py, depth = 0) {
    trace.push({ type: 'enter', px: px.slice(), py: py.slice(), depth });
    const n = px.length;
    if (n <= 3) {
      let best = { d: Infinity, pair: null };
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          trace.push({ type: 'compare', a: px[i], b: px[j], depth });
          const d = Math.hypot(px[i].x - px[j].x, px[i].y - px[j].y);
          if (d < best.d) {
            best = { d, pair: [px[i].id, px[j].id] };
            trace.push({ type: 'best', best: { d, pair: best.pair }, depth });
          }
        }
      }
      trace.push({ type: 'exit', best, depth });
      return best;
    }
    const mid = Math.floor(n / 2);
    const midx = px[mid].x;
    const Lx = px.slice(0, mid);
    const Rx = px.slice(mid);
    const Ly = [], Ry = [];
    for (const p of py)
      (p.x <= midx ? Ly : Ry).push(p);
    const left = rec(Lx, Ly, depth + 1);
    const right = rec(Rx, Ry, depth + 1);
    let best = left.d < right.d ? left : right;
    trace.push({ type: 'merge-start', midx, best: { d: best.d, pair: best.pair }, depth });
    const strip = py.filter(p => Math.abs(p.x - midx) < best.d);
    trace.push({ type: 'strip', strip: strip.slice(), depth });
    for (let i = 0; i < strip.length; i++) {
      for (let j = i + 1; j < strip.length && (strip[j].y - strip[i].y) < best.d; j++) {
        trace.push({ type: 'compare', a: strip[i], b: strip[j], depth });
        const d = Math.hypot(strip[i].x - strip[j].x, strip[i].y - strip[j].y);
        if (d < best.d) {
          best = { d, pair: [strip[i].id, strip[j].id] };
          trace.push({ type: 'best', best: { d, pair: best.pair }, depth });
        }
      }
    }
    trace.push({ type: 'merge-end', best: { d: best.d, pair: best.pair }, depth });
    trace.push({ type: 'exit', best, depth });
    return best;
  }
  const best = rec(px, py, 0);
  return { trace, best };
}

/** 
 * Creates an animator for visualizing the closest pair algorithm.
 * @param {function} draw The drawing function.
 * @param {HTMLElement} traceBox The container for trace lines.
 * @return {object} The animator with animate and stop methods.
 */
function makeAnimator(draw, traceBox, mapping, findMappedById) {
  let controller = null;
  const regionStack = [];
  const currentRegion = () => regionStack.length ? regionStack[regionStack.length - 1] : null;
  return {
    async animate(traceArr, speedMs) {
      if (controller)
        controller.abort();
      controller = new AbortController();
      const { signal } = controller;

      let bestSoFar = null; // keep track of best pair so far
      for (const ev of traceArr) {
        if (signal.aborted)
          throw new Error('aborted');

        const line = document.createElement('div');
        line.className = 'trace-line';
        line.style.paddingLeft = `${(ev.depth || 0) * 1}rem`;

        // enter case when we enter a recursive call
        if (ev.type === 'enter') {
          line.textContent = `${'  '.repeat(ev.depth)}enter n=${ev.px.length}`;
          const selectedMapped = ev.px.map(p => findMappedById(p.id)); // mapped points in this call
          if (selectedMapped.length) {
            const xs = selectedMapped.map(p => p.x);
            const minMX = Math.min(...xs);
            const maxMX = Math.max(...xs);
            const left = Math.max(mapping.pad, minMX - 8);
            const right = Math.min(mapping.cvsWidth - mapping.pad, maxMX + 8);
            // draw the entry region
            draw({ subdomain: { left, right, points: selectedMapped } });
          } else {
            draw({}); // draw empty region
          }
          // compare case when we compare two points. we draw the line between them
        } else if (ev.type === 'compare') {
          const a = findMappedById(ev.a.id), b = findMappedById(ev.b.id); // mapped points being compared
          line.textContent = `${'  '.repeat(ev.depth)}compare ${ev.a.id} - ${ev.b.id}`;
          draw({ compare: { a, b }, region: currentRegion() }); // draw comparison line in current region

          // best case when we found a new best pair we draw the red line between them
        } else if (ev.type === 'best') {
          bestSoFar = ev.best;
          line.textContent = `${'  '.repeat(ev.depth)}best updated d=${ev.best.d.toFixed(2)}`;
          const mappedPair = ev.best.pair ? mapping.getMappedPair(ev.best.pair) : null; // mapped best pair
          draw({ best: mappedPair, region: currentRegion() }); // draw best line in current region

          // merge start case when we start merging two halves
        } else if (ev.type === 'merge-start') {
          const midxOrig = ev.midx; // middle x in original coords

          // middle x in mapped coords (affine transform back)
          const midx = mapping.pad + (midxOrig - mapping.minX) * mapping.scale + (mapping.w - mapping.spanX * mapping.scale) / 2;

          // draw the merging region (convert points distance to pixels)
          const dMapped = ev.best && typeof ev.best.d === 'number' ? mapping.distanceToPixels(ev.best.d) : (bestSoFar && mapping.distanceToPixels(bestSoFar.d)) || 0;
          const left = Math.max(mapping.pad, midx - dMapped);
          const right = Math.min(mapping.cvsWidth - mapping.pad, midx + dMapped);
          line.textContent = `${'  '.repeat(ev.depth)}merge start (midx=${midxOrig})`;
          regionStack.push({ left, right }); // push current region to stack to keep track of regions for drawing
          draw({
            midx,
            region: currentRegion(),
            best: bestSoFar ? mapping.getMappedPair(bestSoFar.pair) : null
          });

          // strip case when we process the strip area in the merge case
        } else if (ev.type === 'strip') {
          const stripMapped = ev.strip.map(s => findMappedById(s.id));
          line.textContent = `${'  '.repeat(ev.depth)}strip size=${ev.strip.length}`;
          draw({
            strip: stripMapped,
            best: bestSoFar ? mapping.getMappedPair(bestSoFar.pair) : null,
            region: currentRegion()
          });

          // merge end case when we finish merging two halves
        } else if (ev.type === 'merge-end') {
          line.textContent = `${'  '.repeat(ev.depth)}merge end d=${ev.best.d.toFixed(2)}`;
          draw({
            best: ev.best.pair ? mapping.getMappedPair(ev.best.pair) : null,
            region: currentRegion()
          });
          regionStack.pop(); // pop the region

          // exit case when we exit a recursive call
        } else if (ev.type === 'exit') {
          line.textContent = `${'  '.repeat(ev.depth)}exit d=${ev.best.d.toFixed(2)}`;
        }
        traceBox.appendChild(line);
        traceBox.scrollTop = traceBox.scrollHeight;
        await delay(speedMs);
      }
      controller = null;
    },
    stop() {
      if (controller) {
        controller.abort();
        controller = null;
      }
    }
  };
}

/** * Visualizes a test case for the closest pair algorithm.
 * @param {HTMLElement} parent The parent container to append the visualization to.
 * @param {Array<{ x: number, y: number }>} points The array of input points.
 * @param {number} testCaseIndex The index of the test case.
 */
window.visualizeTestCase = function visualizeTestCase(parent, points, testCaseIndex) {
  const card = document.createElement('div');
  card.className = 'card';
  const title = document.createElement('div');
  title.className = 'content';
  title.innerHTML = `<h2>Test ${testCaseIndex + 1}: ${points.length} points</h2>`;
  card.appendChild(title);

  const controls = document.createElement('div');
  controls.className = 'inline-nav';
  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn';
  clearBtn.textContent = 'Clear';
  const playBtn = document.createElement('button');
  playBtn.className = 'btn';
  playBtn.textContent = 'Play';
  const stopBtn = document.createElement('button');
  stopBtn.className = 'btn';
  stopBtn.textContent = 'Stop';
  stopBtn.disabled = true;

  controls.appendChild(clearBtn);
  controls.appendChild(playBtn);
  controls.appendChild(stopBtn);

  const speedLabel = document.createElement('label');
  speedLabel.style.marginLeft = '8px';
  speedLabel.innerHTML = `<small>speed</small> <input type="range" min="0" max="1" value="0.5" step="0.01" class="speed-range">`;

  controls.appendChild(speedLabel);
  card.appendChild(controls);

  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'canvas-wrap';
  const cvs = document.createElement('canvas');
  cvs.width = 720;
  cvs.height = 420;
  cvs.id = `board-${testCaseIndex}`;
  canvasWrap.appendChild(cvs);
  card.appendChild(canvasWrap);

  const info = document.createElement('div');
  info.className = 'info';
  info.id = `info-${testCaseIndex}`;
  info.textContent = 'Ready';
  card.appendChild(info);

  const traceBox = document.createElement('div');
  traceBox.className = 'steps';
  traceBox.textContent = '';
  card.appendChild(traceBox);

  traceBox.style.maxHeight = '220px';
  traceBox.style.overflowY = 'auto';
  traceBox.style.padding = '8px';

  parent.appendChild(card);

  const ptsIn = points.map((p, i) => ({ x: Number(p.x), y: Number(p.y), id: i }));
  const pad = 24;
  const mapping = computeMapping(ptsIn, cvs.width, cvs.height, pad);
  const mapped = mapping.mapped;
  const R = 6;

  const draw = makeDrawer(cvs, mapped, mapping, R);
  const findMappedById = id => mapping.idMap.get(id);
  const animator = makeAnimator(draw, traceBox, mapping, findMappedById);

  const speedElem = controls.querySelector('.speed-range');
  playBtn.addEventListener('click', async () => {
    if (mapped.length < 2) { alert('Need at least 2 points'); return; }
    playBtn.disabled = true; stopBtn.disabled = false; clearBtn.disabled = true;
    traceBox.innerHTML = '';
    info.textContent = 'Running...';
    const { trace, best } = closestPairTrace(ptsIn);
    const sliderVal = speedElem ? Number(speedElem.value) : 0.5;
    const speed = Math.max(10, (1 - sliderVal) * 1000);
    try {
      await animator.animate(trace, speed);
      info.textContent = `Done. best d≈${best.d.toFixed(2)}`;
    } catch (e) {
      info.textContent = 'Stopped.';
    } finally {
      playBtn.disabled = false; stopBtn.disabled = true; clearBtn.disabled = false;
    }
  });

  stopBtn.addEventListener('click', () => {
    animator.stop();
  });

  clearBtn.addEventListener('click', () => {
    traceBox.innerHTML = '';
  });

  draw();
};
