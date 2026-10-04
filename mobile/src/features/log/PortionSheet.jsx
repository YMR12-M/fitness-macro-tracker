// Choose how much of a food was eaten.
//
// The quantity is a stepper rather than a bare number field: adjusting a
// portion from 100 g to 150 g should be taps, not a trip to the keypad. Macros
// preview live, scaled from the catalog row, so the number logged is never a
// surprise.
import { useState } from 'react';
import { Sheet } from '../../components/ui/Sheet.jsx';
import { Segmented, SelectField } from '../../components/ui/Field.jsx';
import { Stepper } from '../../components/ui/Stepper.jsx';
import { Stat } from '../../components/ui/Card.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { MEAL_TYPES, formatNumber, mealTypeForNow } from '../../lib/format.js';

const UNIT_OPTIONS = ['g', 'ml', 'piece', 'scoop', 'cup', 'tbsp', 'tsp'].map((u) => ({ value: u, label: u }));

/** Portion sizes move in different increments for a weight than for a count. */
const stepFor = (unit) => (unit === 'g' || unit === 'ml' ? 10 : 1);

export function PortionSheet({ food, date, onClose, onSubmit, submitting }) {
  const [quantity, setQuantity] = useState(String(food.serving_size ?? 100));
  const [unit, setUnit] = useState(food.serving_unit ?? 'g');
  // Default to the meal it probably is right now rather than always to lunch.
  const [mealType, setMealType] = useState(mealTypeForNow());

  const factor = Number(quantity) / Number(food.serving_size || 100);
  const scaled =
    Number.isFinite(factor) && factor > 0
      ? {
          calories: food.calories * factor,
          protein_g: food.protein_g * factor,
          carbs_g: food.carbs_g * factor,
          fat_g: food.fat_g * factor
        }
      : { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

  return (
    <Sheet
      open
      onClose={onClose}
      title={food.name}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: '0 0 auto' }}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || !(Number(quantity) > 0)}
            onClick={() =>
              onSubmit({
                food_id: food.id,
                meal_type: mealType,
                quantity: Number(quantity),
                unit,
                logged_on: date
              })
            }
          >
            {submitting ? <Spinner label="Logging" /> : `Log ${formatNumber(scaled.calories)} kcal`}
          </button>
        </>
      }
    >
      <p className="card-subtitle">
        Reference: {formatNumber(food.calories)} kcal per {formatNumber(food.serving_size)}
        {food.serving_unit}
        {food.source !== 'custom' && ' — USDA FoodData Central'}
      </p>

      <Stepper
        label="Quantity"
        value={quantity}
        onChange={setQuantity}
        step={stepFor(unit)}
        min={1}
        max={5000}
        suffix={unit}
      />

      <SelectField label="Unit" options={UNIT_OPTIONS} value={unit} onChange={(event) => setUnit(event.target.value)} />

      <Segmented
        name="meal-type"
        label="Meal"
        value={mealType}
        onChange={setMealType}
        options={MEAL_TYPES.map((t) => ({ value: t.value, label: t.label }))}
      />

      <div className="card" style={{ background: 'var(--sunken)' }}>
        <div className="grid-2" style={{ rowGap: 14 }}>
          <Stat label="Calories" value={formatNumber(scaled.calories)} unit="kcal" />
          <Stat label="Protein" value={formatNumber(scaled.protein_g, 1)} unit="g" />
          <Stat label="Carbs" value={formatNumber(scaled.carbs_g, 1)} unit="g" />
          <Stat label="Fat" value={formatNumber(scaled.fat_g, 1)} unit="g" />
        </div>
      </div>
    </Sheet>
  );
}
