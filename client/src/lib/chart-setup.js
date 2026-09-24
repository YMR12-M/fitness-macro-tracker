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

export function baseOptions() {
  const grid = token('--card-border', 'rgba(255,255,255,0.06)');
  const text = token('--text2', '#777');

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { color: text, boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 14, font: { size: 11 } }
      },
      tooltip: {
        backgroundColor: token('--bg3', '#141414'),
        borderColor: grid,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        titleColor: token('--text', '#ebebeb'),
        bodyColor: text,
        displayColors: true,
        usePointStyle: true
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: text, font: { size: 11 } }, border: { color: grid } },
      y: {
        beginAtZero: true,
        grid: { color: grid },
        ticks: { color: text, font: { size: 11 } },
        border: { display: false }
      }
    }
  };
}
