import { recordAttempt, getStats } from './storage.js';

const MODULE = 'tape';
const PRINT_COUNT = 22;
const STREAM_MS = 140;

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

function generateTape() {
  const biasRoll = Math.random();
  let bias;
  if (biasRoll < 0.4) bias = 0.68 + Math.random() * 0.22; // buy-heavy
  else if (biasRoll < 0.8) bias = 0.1 + Math.random() * 0.22; // sell-heavy
  else bias = 0.42 + Math.random() * 0.16; // balanced

  let price = 100 + Math.random() * 5;
  const prints = [];
  for (let i = 0; i < PRINT_COUNT; i++) {
    const side = Math.random() < bias ? 'buy' : 'sell';
    const size = Math.random() < 0.7 ? randInt(2, 18) : randInt(20, 70);
    price += side === 'buy' ? Math.random() * 0.05 : -Math.random() * 0.05;
    prints.push({ price: Math.round(price * 100) / 100, size, side });
  }
  return prints;
}

function gradeTape(prints) {
  let buyVol = 0;
  let sellVol = 0;
  prints.forEach((p) => (p.side === 'buy' ? (buyVol += p.size) : (sellVol += p.size)));
  let answer = 'balanced';
  if (buyVol > sellVol * 1.25) answer = 'buy';
  else if (sellVol > buyVol * 1.25) answer = 'sell';
  return { buyVol, sellVol, answer };
}

const CHOICES = [
  { id: 'buy', label: 'Buyers were more aggressive' },
  { id: 'sell', label: 'Sellers were more aggressive' },
  { id: 'balanced', label: 'Roughly balanced' },
];

export function initTapeDrill(container) {
  let prints = [];
  let shownCount = 0;
  let runningBuy = 0;
  let runningSell = 0;
  let timer = null;
  let answered = false;

  function updateScorePill() {
    const stats = getStats(MODULE);
    const pill = container.querySelector('.score-pill');
    if (pill) pill.textContent = `Score: ${stats.correct}/${stats.total}`;
  }

  function appendRow(p) {
    const win = container.querySelector('.tape-window');
    const row = document.createElement('div');
    row.className = `tape-row ${p.side}`;
    row.innerHTML = `<span>$${p.price.toFixed(2)}</span><span>${p.size}</span><span>${p.side === 'buy' ? 'BUY (lifted ask)' : 'SELL (hit bid)'}</span>`;
    win.appendChild(row);
    win.scrollTop = win.scrollHeight;
  }

  function updateDeltaDisplay() {
    const delta = runningBuy - runningSell;
    const el = container.querySelector('#tape-delta');
    if (el) {
      el.textContent = `${delta >= 0 ? '+' : ''}${delta}`;
      el.className = delta >= 0 ? 'delta-pos' : 'delta-neg';
    }
    const buyEl = container.querySelector('#tape-buyvol');
    const sellEl = container.querySelector('#tape-sellvol');
    if (buyEl) buyEl.textContent = runningBuy;
    if (sellEl) sellEl.textContent = runningSell;
  }

  function stepStream() {
    if (shownCount >= prints.length) {
      clearInterval(timer);
      timer = null;
      return;
    }
    const p = prints[shownCount];
    if (p.side === 'buy') runningBuy += p.size;
    else runningSell += p.size;
    appendRow(p);
    updateDeltaDisplay();
    shownCount += 1;
  }

  function fastForward() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    while (shownCount < prints.length) {
      stepStream();
    }
  }

  function newRound() {
    prints = generateTape();
    shownCount = 0;
    runningBuy = 0;
    runningSell = 0;
    answered = false;
    if (timer) clearInterval(timer);

    container.innerHTML = `
      <div class="drill-controls">
        <span class="score-pill">Score: 0/0</span>
        <button class="btn primary" id="tape-next">New Tape</button>
      </div>
      <div class="tape-stats">
        <span><span class="stat-label">Buy vol</span><span id="tape-buyvol" class="tag-buy">0</span></span>
        <span><span class="stat-label">Sell vol</span><span id="tape-sellvol" class="tag-sell">0</span></span>
        <span><span class="stat-label">Delta</span><span id="tape-delta">+0</span></span>
      </div>
      <div class="tape-window"></div>
      <div class="mcq" id="tape-mcq">
        ${CHOICES.map((c) => `<button class="mcq-option" data-id="${c.id}">${c.label}</button>`).join('')}
      </div>
      <div id="tape-feedback"></div>
    `;
    updateScorePill();

    container.querySelector('#tape-next').addEventListener('click', newRound);

    container.querySelectorAll('.mcq-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        fastForward();
        const { buyVol, sellVol, answer } = gradeTape(prints);
        const chosenId = btn.dataset.id;
        const correct = chosenId === answer;
        container.querySelectorAll('.mcq-option').forEach((b) => {
          b.disabled = true;
          if (b.dataset.id === answer) b.classList.add('correct');
          else if (b === btn) b.classList.add('wrong');
        });
        recordAttempt(MODULE, correct);
        updateScorePill();
        const feedback = container.querySelector('#tape-feedback');
        feedback.innerHTML = `
          <div class="feedback ${correct ? 'good' : 'bad'}">
            <strong>${correct ? 'Correct.' : 'Not quite.'}</strong>
            Final tally: <span class="tag-buy">${buyVol} buy</span> vs <span class="tag-sell">${sellVol} sell</span>
            (delta ${buyVol - sellVol >= 0 ? '+' : ''}${buyVol - sellVol}).
            ${answer === 'balanced' ? 'Volume was close enough on both sides to call it balanced.' : `The ${answer === 'buy' ? 'buy' : 'sell'} side dominated total size across the tape.`}
          </div>
        `;
      });
    });

    timer = setInterval(stepStream, STREAM_MS);
  }

  newRound();
}
