import { useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { baseOptions, token } from '../../lib/chart-setup.js';
import { formatWeekday } from '../../lib/format.js';
import { EmptyState } from '../Card.jsx';

/** Stacked grams of protein / carbs / fat per day. */
export function MacroHistoryChart({ days }) {
  const config = useMemo(() => {
    const options = baseOptions();
    return {
      data: {
        labels: days.map((d) => formatWeekday(d.date)),
        datasets: [
          { label: 'Protein', data: days.map((d) => d.protein_g), backgroundColor: token('--protein', '#00e5a0') },
          { label: 'Carbs', data: days.map((d) => d.carbs_g), backgroundColor: token('--carbs', '#4a9eff') },
          { label: 'Fat', data: days.map((d) => d.fat_g), backgroundColor: token('--fat', '#f59e0b') }
        ].map((set) => ({ ...set, borderRadius: 4, maxBarThickness: 26 }))
      },
      options: {
        ...options,
        scales: {
          x: { ...options.scales.x, stacked: true },
          y: { ...options.scales.y, stacked: true, title: { display: true, text: 'grams', color: token('--text2', '#777') } }
        }
      }
    };
  }, [days]);

  if (!days?.length) {
    return <EmptyState icon="🥗" title="No macro history yet">Log meals across a few days to see the split.</EmptyState>;
  }

  return (
    <div className="chart-frame">
      <Bar data={config.data} options={config.options} />
    </div>
  );
}

/** Today's macro split by calorie contribution, not by gram weight. */
export function MacroDonut({ protein_g: protein, carbs_g: carbs, fat_g: fat }) {
  const calories = { protein: protein * 4, carbs: carbs * 4, fat: fat * 9 };
  const total = calories.protein + calories.carbs + calories.fat;

  const config = useMemo(
    () => ({
      data: {
        labels: ['Protein', 'Carbs', 'Fat'],
        datasets: [
          {
            data: [calories.protein, calories.carbs, calories.fat],
            backgroundColor: [token('--protein', '#00e5a0'), token('--carbs', '#4a9eff'), token('--fat', '#f59e0b')],
            borderWidth: 0,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '66%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: token('--text2', '#777'),
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              padding: 14,
              font: { size: 11 }
            }
          },
          tooltip: {
            backgroundColor: token('--bg3', '#141414'),
            borderColor: token('--card-border', 'rgba(255,255,255,0.06)'),
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => {
                const share = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                return ` ${ctx.label}: ${Math.round(ctx.parsed)} kcal (${share}%)`;
              }
            }
          }
        }
      }
    }),
    [calories.protein, calories.carbs, calories.fat, total]
  );

  if (total === 0) {
    return <EmptyState icon="🍽️" title="Nothing logged today">Add a meal to see today's macro split.</EmptyState>;
  }

  return (
    <div className="chart-frame chart-frame-sm">
      <Doughnut data={config.data} options={config.options} />
    </div>
  );
}
