// Lazily-loaded chart wrappers, for screens that are themselves eager.
//
// Chart.js plus its React binding is ~60 kB gzipped — a quarter of the app's
// whole first load, for two cards that start below the fold on every phone
// screen. The Today screen cannot be route-split (it is the landing screen, and
// deferring it would show a spinner instead of the thing people opened the app
// for), so the charts inside it are split instead: the ring, the macro bars and
// the day's numbers paint immediately, and the charts stream in behind them
// under a placeholder of the same height, so nothing shifts when they arrive.
//
// Route-split screens (Progress) import the chart components directly — their
// whole route is already deferred, and a second level of suspense there would
// only add another flash of placeholder.
import { Suspense, lazy } from 'react';
import { Skeleton } from '../ui/Skeleton.jsx';

const CaloriesChartImpl = lazy(() =>
  import('./CaloriesChart.jsx').then((m) => ({ default: m.CaloriesChart }))
);
const MacroDonutImpl = lazy(() => import('./MacroChart.jsx').then((m) => ({ default: m.MacroDonut })));

/** Reserves the exact height the chart will take, so its arrival shifts nothing. */
function ChartFallback({ className = 'chart-frame' }) {
  return (
    <div className={className}>
      <Skeleton height="100%" radius="var(--radius-sm)" />
    </div>
  );
}

export function LazyCaloriesChart(props) {
  return (
    <Suspense fallback={<ChartFallback />}>
      <CaloriesChartImpl {...props} />
    </Suspense>
  );
}

export function LazyMacroDonut(props) {
  return (
    <Suspense fallback={<ChartFallback className="chart-frame chart-frame-sm" />}>
      <MacroDonutImpl {...props} />
    </Suspense>
  );
}
