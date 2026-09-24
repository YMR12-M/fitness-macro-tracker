import { Progress } from './Card.jsx';
import { formatNumber } from '../lib/format.js';

const MACROS = [
  { key: 'protein', label: 'Protein', color: 'var(--protein)' },
  { key: 'carbs', label: 'Carbs', color: 'var(--carbs)' },
  { key: 'fat', label: 'Fat', color: 'var(--fat)' }
];

export function MacroBars({ macros, targets }) {
  return (
    <div className="list">
      {MACROS.map(({ key, label, color }) => {
        const eaten = macros[`${key}_g`] ?? 0;
        const target = targets[`${key}_g`] ?? 0;
        return (
          <div className="macro-row" key={key}>
            <div className="macro-head">
              <span className="macro-name">
                <span className="macro-dot" style={{ background: color }} aria-hidden="true" />
                {label}
              </span>
              <span className="macro-amount">
                {formatNumber(eaten, 1)} / {formatNumber(target)} g
              </span>
            </div>
            <Progress value={eaten} max={target} color={color} />
          </div>
        );
      })}
    </div>
  );
}
