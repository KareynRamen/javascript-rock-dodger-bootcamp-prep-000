// Shared helpers for building synthetic OHLC data and drawing it to a canvas.

export function buildFromPivots(pivots, perSeg = 6, noise = 0.06) {
  const closes = [];
  for (let i = 0; i < pivots.length - 1; i++) {
    const a = pivots[i];
    const b = pivots[i + 1];
    for (let s = 0; s < perSeg; s++) {
      const t = s / perSeg;
      const jitter = (Math.random() - 0.5) * Math.abs(b - a || 1) * noise;
      closes.push(a + (b - a) * t + jitter);
    }
  }
  closes.push(pivots[pivots.length - 1]);

  const candles = [];
  let prevClose = closes[0];
  for (let i = 1; i < closes.length; i++) {
    const open = prevClose;
    const close = closes[i];
    const body = Math.abs(close - open) || 0.5;
    const high = Math.max(open, close) + Math.random() * body * 0.45 + 0.05;
    const low = Math.min(open, close) - Math.random() * body * 0.45 - 0.05;
    candles.push({ o: open, h: high, l: low, c: close });
    prevClose = close;
  }
  return candles;
}

export function randomWalk(n, start, vol) {
  const pivots = [start];
  let price = start;
  for (let i = 0; i < n; i++) {
    price += (Math.random() - 0.5) * vol;
    pivots.push(price);
  }
  return buildFromPivots(pivots, 1, 0.02);
}

export function computeScale(candles, canvasHeight, paddingTop = 20, paddingBottom = 24) {
  let min = Infinity;
  let max = -Infinity;
  candles.forEach((c) => {
    if (c.l < min) min = c.l;
    if (c.h > max) max = c.h;
  });
  const pad = (max - min) * 0.08 || 1;
  min -= pad;
  max += pad;
  const range = max - min || 1;
  const usableHeight = canvasHeight - paddingTop - paddingBottom;
  return {
    min,
    max,
    range,
    priceToY: (p) => paddingTop + ((max - p) / range) * usableHeight,
    yToPrice: (y) => max - ((y - paddingTop) / usableHeight) * range,
  };
}

export function drawCandlestickChart(canvas, candles, opts = {}) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const leftPad = opts.leftPad ?? 8;
  const rightPad = opts.rightPad ?? 56;
  const scale = computeScale(candles, h, opts.paddingTop ?? 16, opts.paddingBottom ?? 20);
  const usableWidth = w - leftPad - rightPad;
  const cw = usableWidth / candles.length;

  // background grid + price labels
  ctx.strokeStyle = 'rgba(139, 150, 165, 0.15)';
  ctx.fillStyle = '#8b96a5';
  ctx.font = '11px monospace';
  ctx.lineWidth = 1;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const price = scale.min + (scale.range * i) / gridLines;
    const y = scale.priceToY(price);
    ctx.beginPath();
    ctx.moveTo(leftPad, y);
    ctx.lineTo(w - rightPad, y);
    ctx.stroke();
    ctx.fillText(price.toFixed(2), w - rightPad + 6, y + 3);
  }

  candles.forEach((c, i) => {
    const x = leftPad + i * cw + cw / 2;
    const up = c.c >= c.o;
    const color = up ? '#2ecc71' : '#e74c3c';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(x, scale.priceToY(c.h));
    ctx.lineTo(x, scale.priceToY(c.l));
    ctx.stroke();

    const yO = scale.priceToY(c.o);
    const yC = scale.priceToY(c.c);
    const bodyTop = Math.min(yO, yC);
    const bodyH = Math.max(Math.abs(yC - yO), 1.5);
    const bodyW = Math.max(cw * 0.6, 2);
    ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyH);
  });

  (opts.lines || []).forEach((line) => {
    const y = scale.priceToY(line.price);
    ctx.strokeStyle = line.color || '#f1c40f';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(leftPad, y);
    ctx.lineTo(w - rightPad, y);
    ctx.stroke();
    ctx.setLineDash([]);
    if (line.label) {
      ctx.fillStyle = line.color || '#f1c40f';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(line.label, w - rightPad + 6, y - 4);
    }
  });

  (opts.markers || []).forEach((marker) => {
    const y = scale.priceToY(marker.price);
    ctx.strokeStyle = marker.color || '#4da3ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(leftPad, y);
    ctx.lineTo(w - rightPad, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w - rightPad - 10, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = marker.color || '#4da3ff';
    ctx.fill();
  });

  return { scale, leftPad, rightPad, cw };
}

export function canvasYFromClientY(canvas, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleY = canvas.height / rect.height;
  return (clientY - rect.top) * scaleY;
}
