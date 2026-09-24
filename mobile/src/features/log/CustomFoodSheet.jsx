import { useState } from 'react';
import { Sheet } from '../../components/ui/Sheet.jsx';
import { ErrorBanner } from '../../components/ui/Card.jsx';
import { NumberField, SelectField, TextField } from '../../components/ui/Field.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';

const UNIT_OPTIONS = ['g', 'ml', 'piece', 'scoop', 'cup', 'tbsp', 'tsp'].map((u) => ({ value: u, label: u }));

const EMPTY_FOOD = {
  name: '',
  emoji: '',
  serving_size: '100',
  serving_unit: 'g',
  calories: '',
  protein_g: '',
  carbs_g: '',
  fat_g: ''
};

export function CustomFoodSheet({ open, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(EMPTY_FOOD);
  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  const fieldError = (name) => error?.fieldErrors?.[name];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add a custom food"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: '0 0 auto' }}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || !form.name || form.calories === ''}
            onClick={() => onSubmit(Object.fromEntries(Object.entries(form).filter(([, value]) => value !== '')))}
          >
            {submitting ? <Spinner label="Saving" /> : 'Save food'}
          </button>
        </>
      }
    >
      {error && <ErrorBanner error={error} />}
      <p className="card-subtitle">Enter the values per serving below — they are stored only on your account.</p>

      <TextField label="Name" value={form.name} onChange={update('name')} error={fieldError('name')} autoCapitalize="sentences" />

      <div className="field-row">
        <TextField label="Emoji" value={form.emoji} onChange={update('emoji')} maxLength={4} hint="Optional" />
        <SelectField label="Unit" options={UNIT_OPTIONS} value={form.serving_unit} onChange={update('serving_unit')} />
      </div>

      <div className="field-row">
        <NumberField
          label="Serving size"
          min="1"
          value={form.serving_size}
          onChange={update('serving_size')}
          error={fieldError('serving_size')}
        />
        <NumberField
          label="Calories"
          min="0"
          value={form.calories}
          onChange={update('calories')}
          error={fieldError('calories')}
        />
      </div>

      <div className="field-row">
        <NumberField
          label="Protein (g)"
          min="0"
          step="0.1"
          value={form.protein_g}
          onChange={update('protein_g')}
          error={fieldError('protein_g')}
        />
        <NumberField
          label="Carbs (g)"
          min="0"
          step="0.1"
          value={form.carbs_g}
          onChange={update('carbs_g')}
          error={fieldError('carbs_g')}
        />
      </div>

      <NumberField
        label="Fat (g)"
        min="0"
        step="0.1"
        value={form.fat_g}
        onChange={update('fat_g')}
        error={fieldError('fat_g')}
      />
    </Sheet>
  );
}
