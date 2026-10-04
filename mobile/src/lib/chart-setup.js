// Chart.js is tree-shakeable: only the pieces the app actually draws are
// registered, which keeps the charts chunk small.
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from 'chart.js';

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
);

/** Read a CSS token so charts follow the active theme instead of hardcoding hex. */
export function token(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * A diagonal hatch fill, for the "burned" bars. Hatching reads as a different
 * *kind* of quantity from the solid "eaten" bars, so the two never depend on
 * telling two similar colours apart.
 */
export function hatch(color) {
  const size = 8;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const ctx = tile.getContext('2d');
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  // The main stroke plus a stub in two corners so the pattern tiles unbroken.
  for (const [x1, y1, x2, y2] of [
    [-2, size + 2, size + 2, -2],
    [-2, 2, 2, -2],
    [size - 2, size + 2, size + 2, size - 2]
  ]) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  return ctx.createPattern(tile, 'repeat');
}

/** The face every chart label is drawn in: the same as the page's body text. */
export function chartFont(extra = {}) {
  return { family: token('--font-body', 'sans-serif'), size: 11, weight: 600, ...extra };
}

/**
 * Chart defaults tuned for a phone.
 *
 * Three differences from the desktop client's equivalent, all forced by a
 * ~340px plot area:
 *
 *  - `maxTicksLimit` on both axes. Chart.js will happily draw thirty x-labels
 *    into that width, at which point it rotates them 90° and the chart becomes
 *    a wall of vertical text.
 *  - `intersect: false` hover, because a fingertip is about 8mm across and
 *    cannot land on a 3px point.
 *  - Legends and ticks a point smaller, with tighter padding, so the plot keeps
 *    the height rather than the chrome.
 */
export function baseOptions({ maxXTicks = 7 } = {}) {
  const ink = token('--ink', '#f0eadb');
  const paper = token('--bg', '#11100d');
  const text = token('--ink-2', '#ada591');
  const grid = token('--line-soft', 'rgba(240,234,219,0.18)');
  const rule = token('--line', '#f0eadb');

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    // A touch has no hover, so the tooltip is the only readout: give it a
    // generous radius to catch imprecise taps.
    hover: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { color: text, boxWidth: 10, boxHeight: 10, padding: 14, font: chartFont({ size: 11 }) }
      },
      // An inverted slip: ink with paper type, square, no border.
      tooltip: {
        backgroundColor: ink,
        titleColor: paper,
        bodyColor: paper,
        borderWidth: 0,
        padding: 11,
        cornerRadius: 0,
        boxWidth: 10,
        boxHeight: 10,
        titleFont: chartFont({ family: token('--font-display', 'sans-serif'), size: 16, weight: 800 }),
        bodyFont: chartFont({ size: 12 })
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: text, font: chartFont({ size: 10 }), maxRotation: 0, autoSkip: true, maxTicksLimit: maxXTicks },
        border: { color: rule, width: 2 }
      },
      y: {
        beginAtZero: true,
        grid: { color: grid, lineWidth: 1 },
        ticks: { color: text, font: chartFont({ size: 10, weight: 500 }), padding: 6, maxTicksLimit: 5 },
        border: { display: false }
      }
    }
  };
}
