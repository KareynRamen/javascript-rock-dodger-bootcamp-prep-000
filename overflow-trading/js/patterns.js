import { buildFromPivots, drawCandlestickChart } from './chart-utils.js';
import { recordAttempt, getStats } from './storage.js';

const MODULE = 'patterns';

const PATTERNS = [
  {
    id: 'double_top',
    name: 'Double Top',
    build: () => buildFromPivots([100, 124, 110, 125, 96], 8),
    explanation: 'Two peaks at roughly the same level with a pullback between them. Failure to break the first high on the second attempt is a classic bearish reversal signal.',
  },
  {
    id: 'double_bottom',
    name: 'Double Bottom',
    build: () => buildFromPivots([100, 76, 90, 75, 104], 8),
    explanation: 'Two troughs at roughly the same level with a bounce between them. Failure to break the first low on the second attempt is a classic bullish reversal signal.',
  },
  {
    id: 'head_and_shoulders',
    name: 'Head & Shoulders',
    build: () => buildFromPivots([100, 116, 104, 130, 106, 117, 88], 6),
    explanation: 'Three swing highs: left shoulder, a higher head, then a right shoulder that fails to reach the head. A break below the "neckline" confirms a bearish reversal.',
  },
  {
    id: 'inverse_head_and_shoulders',
    name: 'Inverse Head & Shoulders',
    build: () => buildFromPivots([100, 84, 96, 70, 94, 83, 112], 6),
    explanation: 'The mirror image: three swing lows with a deeper middle low, and a right shoulder that fails to reach the head. A break above the neckline confirms a bullish reversal.',
  },
  {
    id: 'bull_flag',
    name: 'Bull Flag',
    build: () => buildFromPivots([100, 132, 127, 130, 125, 128, 122, 125, 144], 5),
    explanation: 'A sharp rally (the pole) followed by a tight, gently downward-sloping consolidation (the flag). Usually resolves as a continuation higher.',
  },
  {
    id: 'bear_flag',
    name: 'Bear Flag',
    build: () => buildFromPivots([100, 68, 73, 70, 75, 72, 78, 75, 56], 5),
    explanation: 'A sharp decline (the pole) followed by a tight, gently upward-sloping consolidation (the flag). Usually resolves as a continuation lower.',
  },
  {
    id: 'ascending_triangle',
    name: 'Ascending Triangle',
    build: () => buildFromPivots([96, 120, 105, 120, 109, 120, 113, 133], 5),
    explanation: 'A flat resistance line tested repeatedly while the lows keep rising, compressing the range. Usually resolves with a breakout above resistance.',
  },
  {
    id: 'descending_triangle',
    name: 'Descending Triangle',
    build: () => buildFromPivots([124, 100, 113, 100, 107, 100, 104, 84], 5),
    explanation: 'A flat support line tested repeatedly while the highs keep falling, compressing the range. Usually resolves with a breakdown below support.',
  },
];

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function initPatternsDrill(container) {
  let current = null;

  function updateScorePill() {
    const stats = getStats(MODULE);
    const pill = container.querySelector('.score-pill');
    if (pill) pill.textContent = `Score: ${stats.correct}/${stats.total}`;
  }

  function newRound() {
    current = PATTERNS[randInt(0, PATTERNS.length)];
    const candles = current.build();
    const options = shuffled(PATTERNS);

    container.innerHTML = `
      <div class="drill-controls">
        <span class="score-pill">Score: 0/0</span>
        <button class="btn primary" id="pat-next">New Pattern</button>
      </div>
      <div class="chart-wrap">
        <canvas id="pat-canvas" class="chart-canvas" width="800" height="340"></canvas>
      </div>
      <div class="mcq" id="pat-mcq">
        ${options.map((p) => `<button class="mcq-option" data-id="${p.id}">${p.name}</button>`).join('')}
      </div>
      <div id="pat-feedback"></div>
    `;
    updateScorePill();

    const canvas = container.querySelector('#pat-canvas');
    drawCandlestickChart(canvas, candles);

    container.querySelector('#pat-next').addEventListener('click', newRound);

    container.querySelectorAll('.mcq-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const chosenId = btn.dataset.id;
        const correct = chosenId === current.id;
        container.querySelectorAll('.mcq-option').forEach((b) => {
          b.disabled = true;
          if (b.dataset.id === current.id) b.classList.add('correct');
          else if (b === btn) b.classList.add('wrong');
        });
        recordAttempt(MODULE, correct);
        updateScorePill();
        const feedback = container.querySelector('#pat-feedback');
        feedback.innerHTML = `
          <div class="feedback ${correct ? 'good' : 'bad'}">
            <strong>${correct ? 'Correct.' : `Not quite — that was a ${current.name}.`}</strong>
            ${current.explanation}
          </div>
        `;
      });
    });
  }

  newRound();
}
