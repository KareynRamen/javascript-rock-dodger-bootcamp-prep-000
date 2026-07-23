import { renderLessons } from './lessons.js';
import { initFootprintDrill } from './footprint.js';
import { initTapeDrill } from './tape.js';
import { initPatternsDrill } from './patterns.js';
import { initSRDrill } from './srzones.js';
import { renderProgress } from './progress.js';

const initialized = new Set();

function initView(view) {
  if (initialized.has(view)) {
    if (view === 'progress') renderProgress(document.getElementById('progress-app'));
    return;
  }
  initialized.add(view);

  switch (view) {
    case 'lessons':
      renderLessons(document.getElementById('lessons-list'));
      break;
    case 'footprint':
      initFootprintDrill(document.getElementById('footprint-app'));
      break;
    case 'tape':
      initTapeDrill(document.getElementById('tape-app'));
      break;
    case 'patterns':
      initPatternsDrill(document.getElementById('patterns-app'));
      break;
    case 'srzones':
      initSRDrill(document.getElementById('srzones-app'));
      break;
    case 'progress':
      renderProgress(document.getElementById('progress-app'));
      break;
    default:
      break;
  }
}

function showView(view) {
  document.querySelectorAll('.view').forEach((el) => {
    el.classList.toggle('active', el.id === `view-${view}`);
  });
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  initView(view);
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

document.getElementById('tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  showView(btn.dataset.view);
});

document.querySelectorAll('[data-goto]').forEach((el) => {
  el.addEventListener('click', () => showView(el.dataset.goto));
});

showView('home');
