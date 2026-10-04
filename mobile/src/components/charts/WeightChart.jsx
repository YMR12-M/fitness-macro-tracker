import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { baseOptions, token } from '../../lib/chart-setup.js';
import { formatShortDate } from '../../lib/format.js';
import { EmptyState } from '../ui/Card.jsx';

/**
 * Body weight over time. The 7-day moving average is the heavy accent line and
 * the raw readings are the thin ink one with hollow square markers, because
 * day-to-day weight swings on water, not fat — the average is the line that
 * actually shows a trend, so it is the one that gets the weight.
 */
export function WeightChart({ entries, movingAverage }) {
  const config = useMemo(() => {
    const ink = token('--ink', '#f0eadb');
    const paper = token('--surface', '#1a1915');
    const accent = token('--accent', '#ff4b2b');
    const options = baseOptions({ maxXTicks: 5 });

    return {
      data: {
        labels: entries.map((e) => formatShortDate(e.recorded_on)),
        datasets: [
          {
            label: 'Weight',
            data: entries.map((e) => e.weight_kg),
            borderColor: ink,
            backgroundColor: paper,
            borderWidth: 1.5,
            pointStyle: 'rect',
            // Points are dropped sooner than on desktop: past ~20 readings in
            // this width they merge into a dotted stripe over the line.
            pointRadius: entries.length > 20 ? 0 : 4,
            pointHitRadius: 14,
            pointBorderWidth: 2,
            pointBorderColor: ink,
            pointBackgroundColor: paper,
            fill: false,
            tension: 0
          },
          ...(movingAverage?.length > 1
            ? [
                {
                  label: '7-day average',
                  data: movingAverage.map((e) => e.weight_kg),
                  borderColor: accent,
                  borderWidth: 4,
                  pointRadius: 0,
                  fill: false,
                  tension: 0.3
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
    return <EmptyState icon="scale" title="No weight entries">Log your weight to start a trend line.</EmptyState>;
  }

  return (
    <div className="chart-frame">
      <Line data={config.data} options={config.options} />
    </div>
  );
}
