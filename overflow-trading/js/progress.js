import { getStats, resetAll } from './storage.js';

const MODULES = [
  { id: 'footprint', label: 'Footprint Drill' },
  { id: 'tape', label: 'Tape Reading' },
  { id: 'patterns', label: 'Chart Patterns' },
  { id: 'srzones', label: 'S/R Zones' },
];

export function renderProgress(container) {
  const cards = MODULES.map(({ id, label }) => {
    const { correct, total } = getStats(id);
    const pct = total ? Math.round((correct / total) * 100) : 0;
    return `
      <div class="progress-card">
        <h4>${label}</h4>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <div class="stat-line">${correct}/${total} correct (${pct}%)</div>
      </div>
    `;
  }).join('');

  const totalAll = MODULES.reduce(
    (acc, { id }) => {
      const s = getStats(id);
      acc.correct += s.correct;
      acc.total += s.total;
      return acc;
    },
    { correct: 0, total: 0 }
  );

  container.innerHTML = `
    <p class="section-intro">
      Overall: ${totalAll.correct}/${totalAll.total} correct
      ${totalAll.total ? `(${Math.round((totalAll.correct / totalAll.total) * 100)}%)` : ''}
    </p>
    <div class="progress-grid">${cards}</div>
    <div class="drill-controls" style="margin-top:1.5rem">
      <button class="btn" id="reset-progress">Reset Progress</button>
    </div>
  `;

  container.querySelector('#reset-progress').addEventListener('click', () => {
    if (window.confirm('Reset all saved progress? This cannot be undone.')) {
      resetAll();
      renderProgress(container);
    }
  });
}
