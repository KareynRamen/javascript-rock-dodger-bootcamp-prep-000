import { recordAttempt, getStats } from './storage.js';

const MODULE = 'footprint';
const IMBALANCE_RATIO = 3;
const ROW_COUNT = 7;

const SCENARIOS = ['bullish_stacked_imbalance', 'bearish_stacked_imbalance', 'buying_absorption_bottom', 'selling_absorption_top', 'no_clear_signal'];

const OPTIONS = [
  { id: 'bullish_stacked_imbalance', text: 'Stacked buy imbalances near the bottom — bullish continuation likely' },
  { id: 'bearish_stacked_imbalance', text: 'Stacked sell imbalances near the top — bearish continuation likely' },
  { id: 'buying_absorption_bottom', text: 'Buying absorption at the low — possible bullish reversal' },
  { id: 'selling_absorption_top', text: 'Selling absorption at the high — possible bearish reversal' },
  { id: 'no_clear_signal', text: 'No clear signal — order flow is balanced here' },
];

const EXPLANATIONS = {
  bullish_stacked_imbalance: (r) => `Rows at $${r[0]} through $${r[r.length - 1]} show ${r.length} consecutive buy imbalances (ask ≥ ${IMBALANCE_RATIO}x bid) stacked near the bottom of the candle — buyers stayed aggressive even as price dipped. That's the textbook setup for upside continuation.`,
  bearish_stacked_imbalance: (r) => `Rows at $${r[0]} through $${r[r.length - 1]} show ${r.length} consecutive sell imbalances (bid ≥ ${IMBALANCE_RATIO}x ask) stacked near the top of the candle — sellers stayed aggressive even as price pushed up. That favors downside continuation.`,
  buying_absorption_bottom: (price) => `The low at $${price} printed far more total volume than any other level, but the bid/ask ratio there stayed roughly balanced — a wave of aggressive selling hit that price and got absorbed by resting buyers instead of breaking lower. Possible bullish reversal.`,
  selling_absorption_top: (price) => `The high at $${price} printed far more total volume than any other level, but the ratio there stayed roughly balanced — aggressive buying got absorbed by resting sellers instead of breaking higher. Possible bearish reversal.`,
  no_clear_signal: () => `No level here reaches the ${IMBALANCE_RATIO}x imbalance threshold and no single level stands out on total volume. This one's genuinely balanced — not every candle has a clean signal.`,
};

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

function baseRow(price) {
  const bidVol = randInt(80, 220);
  const askVol = Math.round(bidVol * (0.75 + Math.random() * 0.5));
  return { price, bidVol, askVol };
}

function generateFootprint(scenario) {
  const tick = 0.25;
  const topPrice = Math.round((100 + Math.random() * 4) * 100) / 100;
  const rows = [];
  for (let i = 0; i < ROW_COUNT; i++) {
    rows.push(baseRow(Math.round((topPrice - i * tick) * 100) / 100));
  }

  if (scenario === 'bullish_stacked_imbalance') {
    for (let i = ROW_COUNT - 3; i < ROW_COUNT; i++) {
      const bidVol = randInt(60, 120);
      rows[i].bidVol = bidVol;
      rows[i].askVol = Math.round(bidVol * (3.2 + Math.random() * 2));
    }
  } else if (scenario === 'bearish_stacked_imbalance') {
    for (let i = 0; i < 3; i++) {
      const askVol = randInt(60, 120);
      rows[i].askVol = askVol;
      rows[i].bidVol = Math.round(askVol * (3.2 + Math.random() * 2));
    }
  } else if (scenario === 'buying_absorption_bottom') {
    const bidVol = randInt(500, 650);
    rows[ROW_COUNT - 1].bidVol = bidVol;
    rows[ROW_COUNT - 1].askVol = Math.round(bidVol * (0.8 + Math.random() * 0.4));
  } else if (scenario === 'selling_absorption_top') {
    const askVol = randInt(500, 650);
    rows[0].askVol = askVol;
    rows[0].bidVol = Math.round(askVol * (0.8 + Math.random() * 0.4));
  }

  return rows;
}

function flagFor(row) {
  if (row.askVol >= row.bidVol * IMBALANCE_RATIO) return 'buy';
  if (row.bidVol >= row.askVol * IMBALANCE_RATIO) return 'sell';
  return 'neutral';
}

function buildRound() {
  const scenario = SCENARIOS[randInt(0, SCENARIOS.length)];
  const rows = generateFootprint(scenario);
  const flags = rows.map(flagFor);
  return { scenario, rows, flags };
}

function renderTable(round) {
  const { rows, flags } = round;
  const rowsHtml = rows
    .map((row, i) => {
      const delta = row.askVol - row.bidVol;
      const deltaClass = delta >= 0 ? 'delta-pos' : 'delta-neg';
      const bidClass = flags[i] === 'sell' ? 'cell-sell-imb' : '';
      const askClass = flags[i] === 'buy' ? 'cell-buy-imb' : '';
      const rowClass = i === 0 || i === rows.length - 1 ? 'extreme-row' : '';
      const label = i === 0 ? ' <span style="color:var(--text-dim)">(high)</span>' : i === rows.length - 1 ? ' <span style="color:var(--text-dim)">(low)</span>' : '';
      return `
        <tr class="${rowClass}">
          <td class="price-cell">$${row.price.toFixed(2)}${label}</td>
          <td class="${bidClass}">${row.bidVol}</td>
          <td class="${askClass}">${row.askVol}</td>
          <td class="${deltaClass}">${delta >= 0 ? '+' : ''}${delta}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table class="footprint-table">
      <thead>
        <tr>
          <th>Price</th>
          <th class="tag-sell">Bid Vol</th>
          <th class="tag-buy">Ask Vol</th>
          <th>Delta</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
}

function shuffledOptions() {
  const opts = [...OPTIONS];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = randInt(0, i + 1);
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

function explanationFor(round) {
  const { scenario, rows } = round;
  if (scenario === 'bullish_stacked_imbalance') {
    const prices = rows.slice(-3).map((r) => r.price.toFixed(2));
    return EXPLANATIONS[scenario](prices);
  }
  if (scenario === 'bearish_stacked_imbalance') {
    const prices = rows.slice(0, 3).map((r) => r.price.toFixed(2));
    return EXPLANATIONS[scenario](prices);
  }
  if (scenario === 'buying_absorption_bottom') {
    return EXPLANATIONS[scenario](rows[rows.length - 1].price.toFixed(2));
  }
  if (scenario === 'selling_absorption_top') {
    return EXPLANATIONS[scenario](rows[0].price.toFixed(2));
  }
  return EXPLANATIONS.no_clear_signal();
}

export function initFootprintDrill(container) {
  let round = buildRound();
  let answered = false;

  function updateScorePill() {
    const stats = getStats(MODULE);
    const pill = container.querySelector('.score-pill');
    if (pill) pill.textContent = `Score: ${stats.correct}/${stats.total}`;
  }

  function render() {
    const options = shuffledOptions();
    container.innerHTML = `
      <div class="drill-controls">
        <span class="score-pill">Score: 0/0</span>
        <button class="btn primary" id="fp-next">New Footprint</button>
      </div>
      <div class="chart-wrap">${renderTable(round)}</div>
      <div class="mcq" id="fp-mcq">
        ${options
          .map((opt) => `<button class="mcq-option" data-id="${opt.id}">${opt.text}</button>`)
          .join('')}
      </div>
      <div id="fp-feedback"></div>
    `;
    updateScorePill();

    container.querySelector('#fp-next').addEventListener('click', () => {
      round = buildRound();
      answered = false;
      render();
    });

    container.querySelectorAll('.mcq-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const chosenId = btn.dataset.id;
        const correct = chosenId === round.scenario;
        container.querySelectorAll('.mcq-option').forEach((b) => {
          b.disabled = true;
          if (b.dataset.id === round.scenario) b.classList.add('correct');
          else if (b === btn) b.classList.add('wrong');
        });
        recordAttempt(MODULE, correct);
        updateScorePill();
        const feedback = container.querySelector('#fp-feedback');
        feedback.innerHTML = `
          <div class="feedback ${correct ? 'good' : 'bad'}">
            <strong>${correct ? 'Correct.' : 'Not quite.'}</strong>
            ${explanationFor(round)}
          </div>
        `;
      });
    });
  }

  render();
}
