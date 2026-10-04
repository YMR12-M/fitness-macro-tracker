import { useEffect, useState } from 'react';
import { useCountUp } from '../../hooks/useCountUp.js';
import { formatNumber } from '../../lib/format.js';

/**
 * The day's calories as a precision dial.
 *
 * Seventy-two ticks around the bezel fill clockwise as the day is eaten, with a
 * marker riding the leading edge. Inside them, a second ring splits what has
 * been eaten into protein / carbs / fat by *calorie* contribution (4 / 4 / 9
 * per gram), so the dial answers "how far am I" and "what is it made of" in
 * one glance — the job the old ring and the separate doughnut did between them.
 *
 * Going over target does not clamp: every tick lights in the accent colour and
 * the page says by how much, because a gauge that quietly stops at full hides
 * exactly the day you most need to see.
 */

const TICKS = 72;
const C = 120; // centre of the 240 × 240 drawing
const R_OUT = 116;
const R_IN = 103;
const R_IN_MAJOR = 95;
const R_ARC = 70;
const ARC_LENGTH = 2 * Math.PI * R_ARC;
const ARC_GAP = 5;

const polar = (radius, degrees) => {
  const angle = ((degrees - 90) * Math.PI) / 180;
  return [C + radius * Math.cos(angle), C + radius * Math.sin(angle)];
};

/** Arc lengths for the protein / carbs / fat ring, with a gap between each. */
function macroArcs(macros) {
  const parts = [
    { key: 'protein', calories: (macros?.protein_g ?? 0) * 4 },
    { key: 'carbs', calories: (macros?.carbs_g ?? 0) * 4 },
    { key: 'fat', calories: (macros?.fat_g ?? 0) * 9 }
  ].filter((part) => part.calories > 0);

  const total = parts.reduce((sum, part) => sum + part.calories, 0);
  if (!total) return [];

  const usable = ARC_LENGTH - ARC_GAP * (parts.length > 1 ? parts.length : 0);
  let cursor = 0;
  return parts.map((part) => {
    const length = (part.calories / total) * usable;
    const arc = { key: part.key, length, start: cursor };
    cursor += length + (parts.length > 1 ? ARC_GAP : 0);
    return arc;
  });
}

export function Dial({ eaten, goal, macros }) {
  const ratio = goal > 0 ? eaten / goal : 0;
  const over = ratio > 1;
  const filled = Math.round(Math.min(ratio, 1) * TICKS);
  const needle = Math.min(ratio, 1) * 360;
  const percent = Math.round(ratio * 100);
  const shownPercent = useCountUp(percent);

  // Ticks and the marker start empty and fill just after mount, so the dial
  // sweeps in rather than appearing already complete.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // A timer rather than requestAnimationFrame: frames do not fire in a
    // background tab, and the plates must not stay empty if the page happened
    // to load there.
    const timer = setTimeout(() => setReady(true), 40);
    return () => clearTimeout(timer);
  }, []);

  const arcs = macroArcs(macros);

  return (
    <div className={`dial${over ? ' is-over' : ''}`}>
      <svg className="dial-svg" viewBox="-14 -14 268 268" aria-hidden="true">
        {Array.from({ length: TICKS }, (_, i) => {
          const degrees = (i * 360) / TICKS;
          const major = i % 6 === 0;
          const [x1, y1] = polar(R_OUT, degrees);
          const [x2, y2] = polar(major ? R_IN_MAJOR : R_IN, degrees);
          return (
            <line
              key={i}
              className={`dial-tick${major ? ' is-major' : ''}${ready && i < filled ? ' is-on' : ''}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              style={{ '--i': i }}
            />
          );
        })}

        <g
          style={{
            transform: `rotate(${ready ? needle : 0}deg)`,
            transformOrigin: `${C}px ${C}px`,
            transition: 'transform 0.9s var(--ease)'
          }}
        >
          <polygon className="dial-needle" points={`${C},${C - 117} ${C - 6},${C - 129} ${C + 6},${C - 129}`} />
        </g>

        <g transform={`rotate(-90 ${C} ${C})`}>
          <circle className="dial-track" cx={C} cy={C} r={R_ARC} />
          {arcs.map((arc) => (
            <circle
              key={`${arc.key}-edge`}
              className="dial-edge"
              cx={C}
              cy={C}
              r={R_ARC}
              strokeDasharray={`${arc.length} ${ARC_LENGTH}`}
              strokeDashoffset={-arc.start}
            />
          ))}
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              className="dial-arc"
              cx={C}
              cy={C}
              r={R_ARC}
              stroke={`var(--${arc.key})`}
              strokeDasharray={`${arc.length} ${ARC_LENGTH}`}
              strokeDashoffset={-arc.start}
            />
          ))}
        </g>
      </svg>

      <div className="dial-center">
        <span className="dial-percent">
          {formatNumber(Math.round(shownPercent))}
          <small>%</small>
        </span>
        <span className="dial-caption">of today&rsquo;s calories</span>
      </div>

      <p className="visually-hidden">
        {formatNumber(eaten)} of {formatNumber(goal)} calories eaten, {formatNumber(percent)} percent
        {over ? ', over target' : ''}.
      </p>
    </div>
  );
}
