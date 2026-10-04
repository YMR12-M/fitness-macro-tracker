import { useEffect, useState } from 'react';
import { Icon } from './Icon.jsx';
import { formatNumber } from '../lib/format.js';

/**
 * Progress as plates loaded on a bar.
 *
 * `plates` slots (ten by default), each worth an equal share of the target. A loaded plate is
 * solid colour, an empty one an outline, and the one in between is part-filled.
 * The count is a prop so water can show one plate per 250 ml glass instead of
 * a bare percentage.
 *
 * It stops at full. Going past the target is reported in words next to the bar
 * (see PlateCell), never by quietly clipping — the bar is a picture of "how
 * far", and the numbers beside it are the record.
 */
export function PlateMeter({ value, max, color = 'var(--ink)', plates = 10, label }) {
  const ratio = max > 0 ? value / max : 0;
  const loaded = Math.min(Math.max(ratio, 0), 1) * plates;

  // Slots load one after another just after mount.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // A timer rather than requestAnimationFrame: frames do not fire in a
    // background tab, and the plates must not stay empty if the page happened
    // to load there.
    const timer = setTimeout(() => setReady(true), 40);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="plates"
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(Math.min(ratio, 1) * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ '--c': color }}
    >
      {Array.from({ length: plates }, (_, i) => {
        const share = ready ? Math.min(Math.max(loaded - i, 0), 1) : 0;
        const state = share >= 0.999 ? ' is-on' : share > 0.05 ? ' is-part' : '';
        return <span key={i} className={`plate${state}`} style={{ '--i': i }} />;
      })}
    </div>
  );
}

const MACROS = {
  protein: { label: 'Protein', letter: 'P' },
  carbs: { label: 'Carbs', letter: 'C' },
  fat: { label: 'Fat', letter: 'F' },
  water: { label: 'Water', letter: 'W' }
};

/** One column of the day's four plates: a macro (or water) against its target. */
export function PlateCell({ kind, eaten, target, unit = 'g', decimals = 0, plates = 10, children }) {
  const { label, letter } = MACROS[kind];
  const hit = target > 0 && eaten >= target;

  return (
    <div className="quad-cell" style={{ '--c': `var(--${kind})`, '--on-c': `var(--on-${kind})` }}>
      <div className="macro-head">
        <span className="macro-name">
          <span className="macro-chip" aria-hidden="true">{letter}</span>
          {label}
        </span>
        {hit && (
          <span className="badge badge-solid">
            <Icon name="check" size={13} strokeWidth={3} />
            Hit
          </span>
        )}
      </div>

      <p className="macro-figure numeric">
        <b>{formatNumber(eaten, decimals)}</b>
        <span>
          / {formatNumber(target)} {unit}
        </span>
      </p>

      <PlateMeter
        value={eaten}
        max={target}
        color={`var(--${kind})`}
        plates={plates}
        label={`${label}: ${formatNumber(eaten, decimals)} of ${formatNumber(target)} ${unit}`}
      />

      {children}
    </div>
  );
}
