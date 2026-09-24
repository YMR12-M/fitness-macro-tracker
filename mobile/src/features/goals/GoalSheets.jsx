import { useState } from 'react';
import { Sheet } from '../../components/ui/Sheet.jsx';
import { ErrorBanner } from '../../components/ui/Card.jsx';
import { ChipGroup, NumberField, Segmented, TextField } from '../../components/ui/Field.jsx';
import { Stepper } from '../../components/ui/Stepper.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { formatNumber } from '../../lib/format.js';

const ICONS = ['🎯', '⚖️', '💪', '🏃', '🔥', '🏋️', '🚴', '🧘', '📏', '⏱️'];

const DIRECTION_OPTIONS = [
  { value: 'decrease', label: '↓ Lower is better' },
  { value: 'increase', label: '↑ Higher is better' }
];

const EMPTY_GOAL = { title: '', current_value: '', target_value: '', unit: '', deadline: '' };

export function NewGoalSheet({ open, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(EMPTY_GOAL);
  const [icon, setIcon] = useState('🎯');
  const [direction, setDirection] = useState('decrease');

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  const fieldError = (name) => error?.fieldErrors?.[name];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New goal"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: '0 0 auto' }}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || !form.title || form.current_value === '' || form.target_value === ''}
            onClick={() =>
              onSubmit({
                title: form.title,
                icon,
                direction,
                current_value: Number(form.current_value),
                start_value: Number(form.current_value),
                target_value: Number(form.target_value),
                unit: form.unit,
                ...(form.deadline ? { deadline: form.deadline } : {})
              })
            }
          >
            {submitting ? <Spinner label="Saving" /> : 'Create goal'}
          </button>
        </>
      }
    >
      {error && <ErrorBanner error={error} />}

      <TextField
        label="Goal"
        value={form.title}
        onChange={update('title')}
        placeholder="Reach 77 kg"
        error={fieldError('title')}
        autoCapitalize="sentences"
      />

      <ChipGroup
        name="icon"
        label="Icon"
        value={icon}
        onChange={setIcon}
        options={ICONS.map((option) => ({ value: option, label: option, a11yLabel: `Icon ${option}` }))}
      />

      <Segmented
        name="direction"
        label="Direction"
        value={direction}
        onChange={setDirection}
        options={DIRECTION_OPTIONS}
        hint="Whether reaching the target means going up or down from where you are."
      />

      <div className="field-row">
        <NumberField
          label="Current value"
          step="0.1"
          value={form.current_value}
          onChange={update('current_value')}
          error={fieldError('current_value')}
        />
        <NumberField
          label="Target value"
          step="0.1"
          value={form.target_value}
          onChange={update('target_value')}
          error={fieldError('target_value')}
        />
      </div>

      <div className="field-row">
        <TextField label="Unit" value={form.unit} onChange={update('unit')} placeholder="kg, min, reps…" />
        <TextField label="Deadline" type="date" value={form.deadline} onChange={update('deadline')} hint="Optional" />
      </div>

      <p className="field-hint">Your current value doubles as the starting point progress is measured from.</p>
    </Sheet>
  );
}

export function UpdateGoalSheet({ goal, onClose, onSubmit, submitting, error }) {
  const [value, setValue] = useState(String(goal.current_value));

  return (
    <Sheet
      open
      onClose={onClose}
      title={goal.title}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: '0 0 auto' }}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || value === ''}
            onClick={() => onSubmit(Number(value))}
          >
            {submitting ? <Spinner label="Saving" /> : 'Save progress'}
          </button>
        </>
      }
    >
      {error && <ErrorBanner error={error} />}
      <p className="card-subtitle">
        Target is {formatNumber(goal.target_value, 1)} {goal.unit}. Reaching it marks the goal complete automatically.
      </p>

      <Stepper
        label={`Current value${goal.unit ? ` (${goal.unit})` : ''}`}
        value={value}
        onChange={setValue}
        // A tenth is the right nudge for a body weight; a whole unit for reps
        // or minutes, where fractions are meaningless.
        step={goal.unit === 'kg' || goal.unit === 'lb' ? 0.1 : 1}
        min={0}
        max={100000}
        suffix={goal.unit}
      />
    </Sheet>
  );
}
