import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { baseOptions, token } from '../../lib/chart-setup.js';
import { formatShortDate } from '../../lib/format.js';
import { EmptyState } from '../ui/Card.jsx';

/**
 * Body weight over time. The 7-day moving average is drawn alongside the raw
 * readings because day-to-day weight swings on water, not fat — the average is
 * the line that actually shows a trend.
 */
export function WeightChart({ entries, movingAverage }) {
  const config = useMemo(() => {
    const green = token('--green', '#00e5a0');
    const blue = token('--blue', '#4a9eff');
    const options = baseOptions({ maxXTicks: 5 });

    return {
      data: {
        labels: entries.map((e) => formatShortDate(e.recorded_on)),
        datasets: [
          {
            label: 'Weight',
            data: entries.map((e) => e.weight_kg),
            borderColor: green,
            backgroundColor: `${green}22`,
            borderWidth: 2,
            // Points are dropped sooner than on desktop: past ~20 readings in
            // this width they merge into a dotted stripe over the line.
            pointRadius: entries.length > 20 ? 0 : 3,
            pointHitRadius: 14,
            pointBackgroundColor: green,
            fill: true,
            tension: 0.3
          },
          ...(movingAverage?.length > 1
            ? [
                {
                  label: '7-day average',
                  data: movingAverage.map((e) => e.weight_kg),
                  borderColor: blue,
                  borderWidth: 2,
                  borderDash: [5, 4],
                  pointRadius: 0,
                  fill: false,
                  tension: 0.35
                }
              ]
            : [])
        ]
      },
      options: {
        ...options,
        scales: {
          ...options.scales,
          // Weight never starts at zero; a zeroed axis flattens every real change.
          y: { ...options.scales.y, beginAtZero: false }
        }
      }
    };
  }, [entries, movingAverage]);

  if (!entries?.length) {
    return <EmptyState icon="⚖️" title="No weight entries">Log your weight to start a trend line.</EmptyState>;
  }

  return (
    <div className="chart-frame">
      <Line data={config.data} options={config.options} />
    </div>
  );
}
