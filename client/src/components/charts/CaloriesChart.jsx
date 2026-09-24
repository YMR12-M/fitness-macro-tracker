import { useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
import { baseOptions, token } from '../../lib/chart-setup.js';
import { formatWeekday } from '../../lib/format.js';
import { EmptyState } from '../Card.jsx';

/** Calories eaten vs burned per day, with the user's real goal as a reference line. */
export function CaloriesChart({ days }) {
  const config = useMemo(() => {
    const green = token('--green', '#00e5a0');
    const orange = token('--orange', '#ff6b35');

    return {
      data: {
        labels: days.map((d) => formatWeekday(d.date)),
        datasets: [
          {
            type: 'bar',
            label: 'Eaten',
            data: days.map((d) => d.calories_eaten),
            backgroundColor: `${green}cc`,
            borderRadius: { topLeft: 6, topRight: 6 },
            maxBarThickness: 28,
            order: 2
          },
          {
            type: 'bar',
            label: 'Burned',
            data: days.map((d) => d.calories_burned),
            backgroundColor: `${orange}8c`,
            borderRadius: { topLeft: 6, topRight: 6 },
            maxBarThickness: 28,
            order: 2
          },
          {
            type: 'line',
            label: 'Goal',
            data: days.map((d) => d.calorie_goal),
            borderColor: token('--text3', '#444'),
            borderWidth: 2,
            borderDash: [6, 6],
            pointRadius: 0,
            tension: 0,
            order: 1
          }
        ]
      },
      options: baseOptions()
    };
  }, [days]);

  if (!days?.length) {
    return <EmptyState icon="📊" title="Nothing logged yet">Log a meal and this chart fills in.</EmptyState>;
  }

  return (
    <div className="chart-frame">
      <Chart type="bar" data={config.data} options={config.options} />
    </div>
  );
}
