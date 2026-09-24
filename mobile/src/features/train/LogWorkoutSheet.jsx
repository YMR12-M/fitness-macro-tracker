import { useState } from 'react';
import { Sheet } from '../../components/ui/Sheet.jsx';
import { ErrorBanner } from '../../components/ui/Card.jsx';
import { NumberField, Segmented, TextField } from '../../components/ui/Field.jsx';
import { Stepper } from '../../components/ui/Stepper.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { todayISO } from '../../lib/format.js';

const INTENSITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' }
];

export function LogWorkoutSheet({ open, onClose, onSubmit, submitting, error, suggestedType, programId }) {
  const [form, setForm] = useState({
    workout_type: '',
    duration_minutes: '45',
    calories_burned: '',
    performed_on: todayISO()
  });
  const [intensity, setIntensity] = useState('moderate');

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  const fieldError = (name) => error?.fieldErrors?.[name];
  // Falls back to the program's prescribed session, so the usual case is
  // "open, confirm, save" with nothing typed.
  const workoutType = form.workout_type || suggestedType;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log a workout"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: '0 0 auto' }}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || !workoutType || !form.duration_minutes}
            onClick={() =>
              onSubmit({
                workout_type: workoutType,
                duration_minutes: Number(form.duration_minutes),
                calories_burned: form.calories_burned === '' ? 0 : Number(form.calories_burned),
                intensity,
                performed_on: form.performed_on,
                ...(programId ? { program_id: programId } : {})
              })
            }
          >
            {submitting ? <Spinner label="Saving" /> : 'Save workout'}
          </button>
        </>
      }
    >
      {error && <ErrorBanner error={error} />}

      <TextField
        label="Session"
        value={workoutType}
        onChange={update('workout_type')}
        placeholder={suggestedType || 'Push day, 5K run, …'}
        error={fieldError('workout_type')}
        autoCapitalize="sentences"
      />

      <Stepper
        label="Duration"
        value={form.duration_minutes}
        onChange={(value) => setForm((f) => ({ ...f, duration_minutes: value }))}
        step={5}
        min={1}
        max={600}
        suffix="min"
        error={fieldError('duration_minutes')}
      />

      <Segmented
        name="intensity"
        label="Intensity"
        value={intensity}
        onChange={setIntensity}
        options={INTENSITY_OPTIONS}
      />

      <div className="field-row">
        <NumberField
          label="Calories burned"
          min="0"
          value={form.calories_burned}
          onChange={update('calories_burned')}
          error={fieldError('calories_burned')}
          hint="Optional"
        />
        <TextField
          label="Date"
          type="date"
          max={todayISO()}
          value={form.performed_on}
          onChange={update('performed_on')}
        />
      </div>
    </Sheet>
  );
}
