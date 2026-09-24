import { useId } from 'react';

/** Labelled input with inline validation messaging wired to aria-describedby. */
export function Field({ label, error, hint, children, id: providedId }) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
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

/** Radio-group semantics without the radio markup, for compact option rows. */
export function Segmented({ label, value, onChange, options, name }) {
  return (
    <div className="field">
      {label && <span className="field-label" id={`${name}-label`}>{label}</span>}
      <div className="segmented" role="group" aria-labelledby={label ? `${name}-label` : undefined}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="segmented-option"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
