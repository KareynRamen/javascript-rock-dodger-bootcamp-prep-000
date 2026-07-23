import { buildFromPivots, drawCandlestickChart, canvasYFromClientY } from './chart-utils.js';
import { recordAttempt, getStats } from './storage.js';

const MODULE = 'srzones';

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

function generateRound() {
  const isSupport = Math.random() < 0.5;
  const pivots = isSupport ? [100, 90, 103, 91, 106, 90, 109, 122] : [100, 110, 97, 109, 94, 110, 91, 78];
  const levelPrice = isSupport ? 90 : 110;
  const candles = buildFromPivots(pivots, 5, 0.035);

  let min = Infinity;
  let max = -Infinity;
  candles.forEach((c) => {
    if (c.l < min) min = c.l;
    if (c.h > max) max = c.h;
  });
  const tolerance = (max - min) * 0.07;

  return { isSupport, levelPrice, candles, tolerance };
}

export function initSRDrill(container) {
  let round = null;
  let answered = false;
  let scale = null;

  function updateScorePill() {
    const stats = getStats(MODULE);
    const pill = container.querySelector('.score-pill');
    if (pill) pill.textContent = `Score: ${stats.correct}/${stats.total}`;
  }

  function newRound() {
    round = generateRound();
    answered = false;

    container.innerHTML = `
      <div class="drill-controls">
        <span class="score-pill">Score: 0/0</span>
        <button class="btn primary" id="sr-next">New Chart</button>
      </div>
      <div class="chart-wrap">
        <canvas id="sr-canvas" class="chart-canvas" width="800" height="340"></canvas>
      </div>
      <div id="sr-feedback">
        <div class="feedback">Click on the chart where you think the key support or resistance zone is.</div>
      </div>
    `;
    updateScorePill();

    const canvas = container.querySelector('#sr-canvas');
    const drawn = drawCandlestickChart(canvas, round.candles);
    scale = drawn.scale;

    container.querySelector('#sr-next').addEventListener('click', newRound);

    canvas.addEventListener('click', (e) => {
      if (answered) return;
      answered = true;
      const y = canvasYFromClientY(canvas, e.clientY);
      const guessPrice = scale.yToPrice(y);
      const diff = Math.abs(guessPrice - round.levelPrice);
      const correct = diff <= round.tolerance;

      drawCandlestickChart(canvas, round.candles, {
        lines: [{ price: round.levelPrice, color: '#f1c40f', label: round.isSupport ? 'Support' : 'Resistance' }],
        markers: [{ price: guessPrice, color: '#4da3ff' }],
      });

      recordAttempt(MODULE, correct);
      updateScorePill();
      const feedback = container.querySelector('#sr-feedback');
      feedback.innerHTML = `
        <div class="feedback ${correct ? 'good' : 'bad'}">
          <strong>${correct ? 'Correct.' : 'Off target.'}</strong>
          This was ${round.isSupport ? 'support' : 'resistance'} at $${round.levelPrice.toFixed(2)}
          &mdash; you clicked $${guessPrice.toFixed(2)} (off by $${diff.toFixed(2)}).
          ${round.isSupport ? 'Price bounced off that level multiple times before finally breaking above it.' : 'Price got rejected at that level multiple times before finally breaking below it.'}
        </div>
      `;
    });
  }

  newRound();
}
