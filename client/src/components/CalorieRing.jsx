import { formatNumber } from '../lib/format.js';

const RADIUS = 82;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Progress ring for the day's calories. Caps the arc at 100% but keeps showing
 *  the real number, so going over target is visible rather than hidden. */
export function CalorieRing({ eaten, goal }) {
  const ratio = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const offset = CIRCUMFERENCE * (1 - ratio);
  const over = eaten > goal;

  return (
    <div className="ring-wrap">
      <svg className="ring-svg" width="196" height="196" viewBox="0 0 196 196" aria-hidden="true">
        <circle className="ring-track" cx="98" cy="98" r={RADIUS} />
        <circle
          className="ring-value"
          cx="98"
          cy="98"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={over ? { stroke: 'var(--orange)' } : undefined}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-number">{formatNumber(eaten)}</span>
        <span className="ring-caption">of {formatNumber(goal)} kcal</span>
      </div>
      <p className="visually-hidden">
        {formatNumber(eaten)} of {formatNumber(goal)} calories consumed today.
      </p>
    </div>
  );
}
