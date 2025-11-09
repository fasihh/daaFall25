/**
 * Karatsuba multiplication with trace generation.
 * @param {string} xStr 
 * @param {string} yStr 
 * @param {number} depth 
 * @param {Array<{ type: string, text: string, depth: number }>} trace
 * @param {string} name 
 * @returns {{ value: BigInt, trace: Array<{ type: string, text: string, depth: number }> }}
 */
function karatsuba(xStr, yStr, depth = 0, trace = [], name = '') {
  xStr = xStr.replace(/^0+/, '') || '0';
  yStr = yStr.replace(/^0+/, '') || '0';
  const indent = '  '.repeat(depth);
  if (name !== 'z1') {
    trace.push({
      type: 'call',
      text: `${indent}karatsuba(${xStr}, ${yStr})`,
      depth
    });
  }

  if (xStr.length === 1 || yStr.length === 1) {
    const res = (BigInt(xStr) * BigInt(yStr)).toString();
    trace.push({ type: 'base', depth, text: `${indent} base -> ${xStr} * ${yStr} = ${res} -> ${name}` });
    return { value: BigInt(res), trace };
  }

  const n = Math.max(xStr.length, yStr.length);
  const m = Math.floor(n / 2);
  const [padX, padY] = [xStr, yStr].map(s => s.padStart(n, '0'));
  const [highX, lowX] = [padX.slice(0, -m), padX.slice(-m)];
  const [highY, lowY] = [padY.slice(0, -m), padY.slice(-m)];
  trace.push({
    type: 'split',
    text: `${indent} split x=${highX}|${lowX} y=${highY}|${lowY} (m=${m})`,
    depth
  });

  const z0 = karatsuba(lowX, lowY, depth + 1, trace,'z0');
  trace.push({
    type: 'call',
    text: `${indent}karatsuba(${highX} + ${lowX}, ${highY} + ${lowY})`,
    depth: depth + 1
  });
  const z1 = karatsuba((BigInt(lowX) + BigInt(highX)).toString(), (BigInt(lowY) + BigInt(highY)).toString(), depth + 1, trace, 'z1');
  const z2 = karatsuba(highX, highY, depth + 1, trace,'z2');

  const a = z2.value;
  const b = z1.value - z2.value - z0.value;
  const c = z0.value;
  const result = a * (BigInt(10) ** BigInt(2 * m)) + b * (BigInt(10) ** BigInt(m)) + c;
  trace.push({
    type: 'combine',
    text: `${indent} combine -> \n${z2.value} * 10^${2 * m} + (${z1.value} - ${z2.value} - ${z0.value}) * 10^${m} + ${z0.value} = ${result.toString()}`,
    depth
  });

  return {
    trace,
    value: result
  };
}

/**
 * Delay execution for a given amount of time.
 * @param {number} ms - The number of milliseconds to delay.
 * @returns {Promise<void>}
 */
const delay = ms => new Promise((res) => setTimeout(res, ms));

/**
 * Animate the trace steps in the given container.
 * @param {HTMLElement} container 
 * @param {Array<{ type: string, text: string, depth: number }>} trace 
 * @param {Object} options
 * @param {number} options.speed - Delay in milliseconds between steps.
 * @param {AbortSignal} signal - Signal to abort the animation.
 */
async function animateTrace(container, trace, options = {}, signal) {
  const { speed = 500 } = options;
  container.innerHTML = '';
  for (let i = 0; i < trace.length; i++) {
    if (signal && signal.aborted)
      throw new Error('Animation stopped');
    
    const step = trace[i];
    const el = document.createElement('div');
    el.className = 'trace-line';
    if (step.type === 'call') {
      el.style.fontWeight = 'bold';
    } else if (step.type === 'base') {
      el.style.color = 'lightgreen';
    } else if (step.type === 'split') {
      el.style.color = 'aqua';
      el.style.marginBottom = '0.5rem';
    } else if (step.type === 'combine') {
      el.style.color = 'lightcoral';
      el.style.marginBottom = el.style.marginTop = '0.5rem';
    }
    el.style.paddingLeft = `${step.depth * 1}rem`;
    el.textContent = step.text;
    container.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth' });
    await delay(speed);
  }
}

/**
 * Visualize a single test case.
 * @param {HTMLElement} parent Parent element to append the visualization card.
 * @param {string} aStr First number as string.
 * @param {string} bStr Second number as string.
 * @param {number} index Test case index.
 */
function visualizeTestCase(parent, aStr, bStr, index) {
  const card = document.createElement('div');
  card.className = 'card';

  const title = document.createElement('div');
  title.className = 'content';
  title.innerHTML = `<h2>Test ${index + 1}: ${aStr} × ${bStr}</h2>`;
  card.appendChild(title);

  const controls = document.createElement('div');
  controls.className = 'inline-nav';
  const runBtn = document.createElement('button');
  runBtn.className = 'btn';
  runBtn.textContent = 'Play';
  controls.appendChild(runBtn);
  const stopBtn = document.createElement('button');
  stopBtn.className = 'btn';
  stopBtn.textContent = 'Stop';
  stopBtn.disabled = true;
  controls.appendChild(stopBtn);

  const speedLabel = document.createElement('label');
  speedLabel.style.marginLeft = '10px';
  speedLabel.innerHTML = `<small>speed</small> <input type="range" min="0" max="1" value="0.5" step="0.01" class="speed-range">`;
  controls.appendChild(speedLabel);
  card.appendChild(controls);

  const traceBox = document.createElement('div');
  traceBox.className = 'steps';
  traceBox.textContent = 'Ready';
  card.appendChild(traceBox);

  parent.appendChild(card);

  const { trace } = karatsuba(aStr, bStr);

  let controller = null;
  let signal = null;
  let animateTracePromise = null;
  const speedInput = controls.querySelector('.speed-range');
  runBtn.addEventListener('click', async () => {
    controller = new AbortController();
    signal = controller.signal;

    runBtn.disabled = true;
    stopBtn.disabled = false;
    traceBox.textContent = '';

    try {
      animateTracePromise = animateTrace(
        traceBox,
        trace,
        { speed: (1 - Number(speedInput.value)) * 1000 },
        signal
      );
      await animateTracePromise;
    } catch (e) {
      if (e && e.message === 'Animation stopped')
        traceBox.textContent = '';
    } finally {
      controller = null;
      signal = null;
      speedInput.disabled = false;
      runBtn.disabled = false;
      stopBtn.disabled = true;
    }
  });

  stopBtn.addEventListener('click', () => {
    if (controller) {
      controller.abort();
      controller = null;
    }
    runBtn.disabled = false;
    speedInput.disabled = false;
    stopBtn.disabled = true;
  });
}

window.visualizeTestCase = visualizeTestCase;
