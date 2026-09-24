import { useId } from 'react';
import { haptic } from '../../lib/haptics.js';

/**
 * A quantity control with − and + buttons either side of the value.
 *
 * On a phone this beats a bare number input for the same reason the native
 * spin buttons are hidden in base.css: nudging a portion from 100 g to 125 g
 * should be two taps, not "summon the keypad, select-all, retype". The value
 * stays a real text input, so typing an exact number is still one tap away and
 * assistive technology still sees a labelled field.
 *
 * Value is held as a string, not a number, so a half-typed "1." survives the
 * next keystroke instead of being normalised out from under the caret.
 */
export function Stepper({ label, value, onChange, step = 5, min = 0, max = 10000, suffix, hint, error }) {
  const id = useId();
  const current = Number(value);
  const valid = Number.isFinite(current);

  const nudge = (direction) => {
    const base = valid ? current : min;
    // Rounded to the step so repeated taps land on 100, 105, 110 — not on
    // 103, 108 because the starting value happened to be odd.
    const next = Math.round((base + direction * step) / step) * step;
    haptic('tap');
    onChange(String(Math.min(max, Math.max(min, next))));
  };

  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="stepper">
        <button
          type="button"
          className="stepper-btn"
          onClick={() => nudge(-1)}
          disabled={valid && current <= min}
          aria-label={`Decrease ${label ?? 'value'}`}
        >
          −
        </button>
        <input
          id={id}
          className="stepper-input"
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          max={max}
          step={step}
          aria-invalid={error ? 'true' : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix && (
          <span className="stepper-suffix" aria-hidden="true">
            {suffix}
          </span>
        )}
        <button
          type="button"
          className="stepper-btn"
          onClick={() => nudge(1)}
          disabled={valid && current >= max}
          aria-label={`Increase ${label ?? 'value'}`}
        >
          +
        </button>
      </div>
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
