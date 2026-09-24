import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { baseOptions, token } from '../../lib/chart-setup.js';
import { formatShortDate } from '../../lib/format.js';
import { EmptyState } from '../Card.jsx';

/**
 * Body weight over time. The 7-day moving average is drawn alongside the raw
 * readings because day-to-day weight swings on water, not fat — the average is
 * the line that actually shows a trend.
 */
export function WeightChart({ entries, movingAverage }) {
  const config = useMemo(() => {
    const green = token('--green', '#00e5a0');
    const blue = token('--blue', '#4a9eff');
    const options = baseOptions();

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
            pointRadius: entries.length > 40 ? 0 : 3,
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
