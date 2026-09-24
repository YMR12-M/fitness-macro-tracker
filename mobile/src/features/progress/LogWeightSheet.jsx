import { useState } from 'react';
import { Sheet } from '../../components/ui/Sheet.jsx';
import { ErrorBanner } from '../../components/ui/Card.jsx';
import { NumberField, TextField } from '../../components/ui/Field.jsx';
import { Stepper } from '../../components/ui/Stepper.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { todayISO } from '../../lib/format.js';

export function LogWeightSheet({ open, onClose, onSubmit, submitting, error, latestWeight }) {
  // Seeded from the last reading: a weigh-in is nearly always within a
  // kilogram of the one before it, so two taps on the stepper beats typing.
  const [form, setForm] = useState({
    weight_kg: latestWeight ? String(latestWeight) : '',
    body_fat_pct: '',
    notes: '',
    recorded_on: todayISO()
  });

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  const fieldError = (name) => error?.fieldErrors?.[name];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log your weight"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: '0 0 auto' }}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || !form.weight_kg}
            onClick={() => onSubmit(Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '')))}
          >
            {submitting ? <Spinner label="Saving" /> : 'Save'}
          </button>
        </>
      }
    >
      {error && <ErrorBanner error={error} />}

      <Stepper
        label="Weight"
        value={form.weight_kg}
        onChange={(value) => setForm((f) => ({ ...f, weight_kg: value }))}
        step={0.1}
        min={25}
        max={400}
        suffix="kg"
        error={fieldError('weight_kg')}
      />

      <div className="field-row">
        <NumberField
          label="Body fat (%)"
          step="0.1"
          min="1"
          max="70"
          value={form.body_fat_pct}
          onChange={update('body_fat_pct')}
          error={fieldError('body_fat_pct')}
          hint="Optional"
        />
        <TextField
          label="Date"
          type="date"
          max={todayISO()}
          value={form.recorded_on}
          onChange={update('recorded_on')}
        />
      </div>

      <TextField
        label="Notes"
        value={form.notes}
        onChange={update('notes')}
        placeholder="Optional"
        autoCapitalize="sentences"
      />

      <p className="field-hint">
        Logging twice on the same day updates that day rather than adding a second point.
      </p>
    </Sheet>
  );
}
