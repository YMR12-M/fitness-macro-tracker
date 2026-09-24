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
 * Chart defaults tuned for a phone.
 *
 * Three differences from the desktop client's equivalent, all forced by a
 * ~340px plot area:
 *
 *  - `maxTicksLimit` on both axes. Chart.js will happily draw thirty x-labels
 *    into that width, at which point it rotates them 90° and the chart becomes
 *    a wall of vertical text.
 *  - Larger hit radius and `intersect: false`, because a fingertip is about
 *    8mm across and cannot land on a 3px point.
 *  - Legends and ticks a point smaller, with tighter padding, so the plot keeps
 *    the height rather than the chrome.
 */
export function baseOptions({ maxXTicks = 7 } = {}) {
  const grid = token('--card-border', 'rgba(255,255,255,0.06)');
  const text = token('--text2', '#777');

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
        labels: {
          color: text,
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          padding: 12,
          font: { size: 10 }
        }
      },
      tooltip: {
        backgroundColor: token('--bg3', '#141414'),
        borderColor: grid,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
        titleColor: token('--text', '#ebebeb'),
        bodyColor: text,
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        displayColors: true,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: text,
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: maxXTicks
        },
        border: { color: grid }
      },
      y: {
        beginAtZero: true,
        grid: { color: grid },
        ticks: { color: text, font: { size: 10 }, maxTicksLimit: 5 },
        border: { display: false }
      }
    }
  };
}
