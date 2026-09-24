import { formatNumber } from '../../lib/format.js';

const RADIUS = 82;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The day's calories as a ring, with the three numbers behind it underneath.
 *
 * The arc caps at 100% but the readout never does: going over target turns the
 * ring orange and keeps printing the real figure, because a ring that quietly
 * stops at full would hide exactly the day you most need to see.
 *
 * Sized in `vw` (capped at 200px) rather than fixed pixels, so it fills a
 * 360px phone and a 430px one equally well instead of leaving a hole on either.
 */
export function CalorieRing({ eaten, goal, burned, remaining }) {
  const ratio = goal > 0 ? Math.min(eaten / goal, 1) : 0;
  const offset = CIRCUMFERENCE * (1 - ratio);
  const over = eaten > goal;

  return (
    <div className="ring">
      <svg className="ring-svg" viewBox="0 0 196 196" aria-hidden="true">
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
        {formatNumber(eaten)} of {formatNumber(goal)} calories consumed today
        {over ? ', over target' : ''}.
      </p>

      <div className="ring-legend">
        <RingLegendItem label="Eaten" value={eaten} />
        <RingLegendItem label="Burned" value={burned} tone="var(--orange)" />
        <RingLegendItem
          label={remaining < 0 ? 'Over' : 'Left'}
          value={Math.abs(remaining)}
          tone={remaining < 0 ? 'var(--orange)' : 'var(--green)'}
        />
      </div>
    </div>
  );
}

function RingLegendItem({ label, value, tone }) {
  return (
    <div className="ring-legend-item">
      <div className="ring-legend-value" style={tone ? { color: tone } : undefined}>
        {formatNumber(value)}
      </div>
      <div className="ring-legend-label">{label}</div>
    </div>
  );
}
