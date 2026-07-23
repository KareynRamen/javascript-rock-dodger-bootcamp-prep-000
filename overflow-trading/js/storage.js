const KEY = 'overflow-trading-progress-v1';

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (err) {
    return {};
  }
}

function saveAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function recordAttempt(module, correct) {
  const data = loadAll();
  const stat = data[module] || { correct: 0, total: 0 };
  stat.total += 1;
  if (correct) stat.correct += 1;
  data[module] = stat;
  saveAll(data);
  return stat;
}

export function getStats(module) {
  const data = loadAll();
  return data[module] || { correct: 0, total: 0 };
}

export function getAllStats() {
  return loadAll();
}

export function resetAll() {
  localStorage.removeItem(KEY);
}
