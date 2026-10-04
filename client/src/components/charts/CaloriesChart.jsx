import { useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
import { baseOptions, hatch, token } from '../../lib/chart-setup.js';
import { formatWeekday } from '../../lib/format.js';
import { EmptyState } from '../Card.jsx';

/** Calories eaten vs burned per day, with the user's real goal as a reference line.
 *  Eaten is solid ink; burned is hatched, so the two are different *kinds* of bar
 *  rather than two similar colours; a day more than 5% over its goal turns accent. */
export function CaloriesChart({ days }) {
  const config = useMemo(() => {
    const ink = token('--ink', '#f0eadb');
    const muted = token('--ink-2', '#ada591');
    const accent = token('--accent', '#ff4b2b');

    const overGoal = (index) => {
      const day = days[index];
      return day && day.calorie_goal > 0 && day.calories_eaten > day.calorie_goal * 1.05;
    };

    return {
      data: {
        labels: days.map((d) => formatWeekday(d.date)),
        datasets: [
          {
            type: 'bar',
            label: 'Eaten',
            data: days.map((d) => d.calories_eaten),
            backgroundColor: (ctx) => (overGoal(ctx.dataIndex) ? accent : ink),
            borderWidth: 0,
            maxBarThickness: 26,
            order: 2
          },
          {
            type: 'bar',
            label: 'Burned',
            data: days.map((d) => d.calories_burned),
            backgroundColor: hatch(muted),
            borderColor: muted,
            borderWidth: 1.5,
            maxBarThickness: 26,
            order: 2
          },
          {
            type: 'line',
            label: 'Goal',
            data: days.map((d) => d.calorie_goal),
            borderColor: accent,
            borderWidth: 3,
            borderDash: [10, 6],
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
    return <EmptyState icon="progress" title="Nothing logged yet">Log a meal and this chart fills in.</EmptyState>;
  }

  return (
    <div className="chart-frame">
      <Chart type="bar" data={config.data} options={config.options} />
    </div>
  );
}
