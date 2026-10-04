import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { baseOptions, token } from '../../lib/chart-setup.js';
import { formatWeekday } from '../../lib/format.js';
import { EmptyState } from '../ui/Card.jsx';

/** Stacked grams of protein / carbs / fat per day, in the three plate colours.
 *  Each plate is outlined in ink, which is what keeps the yellow legible on paper. */
export function MacroHistoryChart({ days }) {
  const config = useMemo(() => {
    const options = baseOptions({ maxXTicks: 6 });
    const edge = token('--plate-edge-on', '#17150f');

    return {
      data: {
        labels: days.map((d) => formatWeekday(d.date)),
        datasets: [
          { label: 'Protein', data: days.map((d) => d.protein_g), backgroundColor: token('--protein', '#d93018') },
          { label: 'Carbs', data: days.map((d) => d.carbs_g), backgroundColor: token('--carbs', '#2a4fcb') },
          { label: 'Fat', data: days.map((d) => d.fat_g), backgroundColor: token('--fat', '#f2b50c') }
        ].map((set) => ({ ...set, borderColor: edge, borderWidth: 1.5, maxBarThickness: 22 }))
      },
      options: {
        ...options,
        scales: {
          x: { ...options.scales.x, stacked: true },
          y: { ...options.scales.y, stacked: true }
        }
      }
    };
  }, [days]);

  if (!days?.length) {
    return <EmptyState icon="plate" title="No macro history yet">Log meals across a few days to see the split.</EmptyState>;
  }

  return (
    <div className="chart-frame">
      <Bar data={config.data} options={config.options} />
    </div>
  );
}
