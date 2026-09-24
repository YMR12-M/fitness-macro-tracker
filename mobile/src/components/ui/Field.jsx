import { useEffect, useId, useRef } from 'react';
import { haptic } from '../../lib/haptics.js';
import { scrollChildIntoViewX } from '../../lib/scroll.js';

/** Labelled input with inline validation messaging wired to aria-describedby. */
export function Field({ label, error, hint, children, id: providedId }) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
      )}
      {children({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy })}
      {error && (
        <span className="field-error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span className="field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
    </div>
  );
}

export function TextField({ label, error, hint, ...inputProps }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(a11y) => <input className="input" {...a11y} {...inputProps} />}
    </Field>
  );
}

/**
 * A numeric field that asks for the decimal keypad rather than the full
 * keyboard. `inputMode` is what actually decides the on-screen keyboard on
 * both iOS and Android, so it is set here rather than left to each call site.
 */
export function NumberField({ label, error, hint, decimal = true, ...inputProps }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(a11y) => (
        <input
          className="input numeric"
          type="number"
          inputMode={decimal ? 'decimal' : 'numeric'}
          {...a11y}
          {...inputProps}
        />
      )}
    </Field>
  );
}

export function SelectField({ label, error, hint, options, ...selectProps }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(a11y) => (
        <select className="select" {...a11y} {...selectProps}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

/**
 * Radio-group semantics without the radio markup. Scrolls horizontally rather
 * than wrapping, so a five-option row stays one line on a 360px screen.
 */
export function Segmented({ label, value, onChange, options, name, hint }) {
  const generatedId = useId();
  const labelId = `${name ?? generatedId}-label`;
  const groupRef = useRef(null);

  // The row scrolls horizontally, so a selection near its end can open
  // off-screen — a meal type defaulted to "Snack" would otherwise be chosen,
  // correct, and invisible. Nudge it into view whenever it changes, on the
  // horizontal axis only: see lib/scroll.js for why scrollIntoView is wrong here.
  useEffect(() => {
    const group = groupRef.current;
    scrollChildIntoViewX(group, group?.querySelector('[aria-pressed="true"]'));
  }, [value]);

  return (
    <div className="field">
      {label && (
        <span className="field-label" id={labelId}>
          {label}
        </span>
      )}
      <div className="segmented" role="group" ref={groupRef} aria-labelledby={label ? labelId : undefined}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="segmented-option"
            aria-pressed={value === option.value}
            onClick={() => {
              haptic('tap');
              onChange(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

/** The wrapping variant, for option sets too long for one scrolling line. */
export function ChipGroup({ label, value, onChange, options, name, multiline = true }) {
  const generatedId = useId();
  const labelId = `${name ?? generatedId}-label`;

  return (
    <div className="field">
      {label && (
        <span className="field-label" id={labelId}>
          {label}
        </span>
      )}
      <div className={multiline ? 'chips' : 'segmented'} role="group" aria-labelledby={label ? labelId : undefined}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={multiline ? 'chip' : 'segmented-option'}
            aria-pressed={value === option.value}
            aria-label={option.a11yLabel}
            onClick={() => {
              haptic('tap');
              onChange(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
