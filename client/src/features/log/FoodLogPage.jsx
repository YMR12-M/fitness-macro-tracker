import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { foods as foodsApi, meals as mealsApi, summary } from '../../api/endpoints.js';
import { Card, EmptyState, ErrorBanner, Stat } from '../../components/Card.jsx';
import { Modal } from '../../components/Modal.jsx';
import { SelectField, Segmented, TextField } from '../../components/Field.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { useToast } from '../../components/toast-context.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import { FoodSearch } from './FoodSearch.jsx';
import { MEAL_TYPES, formatNumber, mealTypeIcon, mealTypeLabel, todayISO } from '../../lib/format.js';

const UNIT_OPTIONS = ['g', 'ml', 'piece', 'scoop', 'cup', 'tbsp', 'tsp'].map((u) => ({ value: u, label: u }));

export function FoodLogPage() {
  const toast = useToast();
  const [date, setDate] = useState(todayISO());
  const [selectedFood, setSelectedFood] = useState(null);
  const [customOpen, setCustomOpen] = useState(false);

  const dayQuery = useQuery({ queryKey: ['meals', date], queryFn: () => mealsApi.list({ date }) });
  const totalsQuery = useQuery({ queryKey: ['summary', date], queryFn: () => summary.daily(date) });
  const frequentQuery = useQuery({ queryKey: ['meals', 'frequent'], queryFn: mealsApi.frequent });

  const invalidate = [['meals'], ['summary'], ['dashboard']];

  const logMeal = useMutationWithRefresh({
    mutationFn: (payload) => mealsApi.create(payload),
    invalidate,
    onSuccess: ({ meal }) => {
      toast.success(`${meal.name} logged`);
      setSelectedFood(null);
    }
  });

  const deleteMeal = useMutationWithRefresh({
    mutationFn: (id) => mealsApi.remove(id),
    invalidate,
    onSuccess: () => toast.success('Meal removed')
  });

  const createFood = useMutationWithRefresh({
    mutationFn: (payload) => foodsApi.create(payload),
    invalidate: [['foods']],
    onSuccess: ({ food }) => {
      toast.success(`${food.name} added to your catalog`);
      setCustomOpen(false);
      setSelectedFood(food);
    }
  });

  const totals = totalsQuery.data;
  const meals = dayQuery.data?.meals ?? [];

  return (
    <div className="page">
      <div className="grid grid-2">
        <Card title="Log food" subtitle="Search the catalog, or add your own">
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="field-label" htmlFor="log-date">Date</label>
            <input
              id="log-date"
              className="input"
              type="date"
              value={date}
              max={todayISO()}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <FoodSearch onSelect={setSelectedFood} />

          <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={() => setCustomOpen(true)}>
            + Add a custom food
          </button>
        </Card>

        <Card title="Day totals" subtitle={date}>
          {totalsQuery.isPending ? (
            <Spinner label="Loading totals" />
          ) : totals ? (
            <>
              <div className="grid grid-2">
                <Stat label="Calories" value={formatNumber(totals.calories.eaten)} unit={`/ ${formatNumber(totals.calories.goal)}`} />
                <Stat label="Remaining" value={formatNumber(totals.calories.remaining)} unit="kcal" />
                <Stat label="Protein" value={formatNumber(totals.macros.protein_g, 1)} unit={`/ ${totals.targets.protein_g} g`} />
                <Stat label="Carbs" value={formatNumber(totals.macros.carbs_g, 1)} unit={`/ ${totals.targets.carbs_g} g`} />
              </div>

              {frequentQuery.data?.meals?.length > 0 && (
                <>
                  <p className="page-section-title" style={{ marginTop: 18, marginBottom: 8 }}>Log again</p>
                  <div className="segmented">
                    {frequentQuery.data.meals.slice(0, 6).map((meal) => (
                      <button
                        key={`${meal.name}-${meal.meal_type}`}
                        type="button"
                        className="segmented-option"
                        disabled={logMeal.isPending}
                        onClick={() =>
                          logMeal.mutate({
                            food_id: meal.food_id ?? undefined,
                            name: meal.name,
                            emoji: meal.emoji ?? undefined,
                            meal_type: meal.meal_type,
                            quantity: Number(meal.quantity),
                            unit: meal.unit,
                            calories: Number(meal.calories),
                            protein_g: Number(meal.protein_g),
                            carbs_g: Number(meal.carbs_g),
                            fat_g: Number(meal.fat_g),
                            logged_on: date
                          })
                        }
                      >
                        {meal.emoji ?? '🍽️'} {meal.name} · {formatNumber(meal.calories)} kcal
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <ErrorBanner error={totalsQuery.error} />
          )}
        </Card>
      </div>

      <Card title="Logged on this day" subtitle={`${meals.length} ${meals.length === 1 ? 'entry' : 'entries'}`}>
        {dayQuery.isPending ? (
          <Spinner label="Loading meals" />
        ) : dayQuery.error ? (
          <ErrorBanner error={dayQuery.error} />
        ) : meals.length === 0 ? (
          <EmptyState icon="🍽️" title="Nothing logged for this day">
            Search for a food above to add your first entry.
          </EmptyState>
        ) : (
          <div className="list">
            {meals.map((meal) => (
              <div className="list-row" key={meal.id}>
                <span className="list-row-emoji" aria-hidden="true">{meal.emoji ?? mealTypeIcon(meal.meal_type)}</span>
                <div className="list-row-body">
                  <div className="list-row-title">{meal.name}</div>
                  <div className="list-row-meta">
                    {mealTypeLabel(meal.meal_type)} · {formatNumber(meal.quantity)}
                    {meal.unit} · {formatNumber(meal.protein_g, 1)}P · {formatNumber(meal.carbs_g, 1)}C ·{' '}
                    {formatNumber(meal.fat_g, 1)}F
                  </div>
                </div>
                <span className="badge badge-green numeric">{formatNumber(meal.calories)} kcal</span>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={`Remove ${meal.name}`}
                  onClick={() => deleteMeal.mutate(meal.id)}
                  disabled={deleteMeal.isPending}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedFood && (
        <PortionModal
          food={selectedFood}
          date={date}
          onClose={() => setSelectedFood(null)}
          onSubmit={(payload) => logMeal.mutate(payload)}
          submitting={logMeal.isPending}
        />
      )}

      <CustomFoodModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onSubmit={(payload) => createFood.mutate(payload)}
        submitting={createFood.isPending}
        error={createFood.error}
      />
    </div>
  );
}

/** Choose how much of a food was eaten. Macros preview live, scaled from the
 *  catalog row, so the number logged is never a surprise. */
function PortionModal({ food, date, onClose, onSubmit, submitting }) {
  const [quantity, setQuantity] = useState(String(food.serving_size ?? 100));
  const [unit, setUnit] = useState(food.serving_unit ?? 'g');
  const [mealType, setMealType] = useState('lunch');

  const factor = Number(quantity) / Number(food.serving_size || 100);
  const scaled = Number.isFinite(factor) && factor > 0
    ? {
        calories: food.calories * factor,
        protein_g: food.protein_g * factor,
        carbs_g: food.carbs_g * factor,
        fat_g: food.fat_g * factor
      }
    : { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

  return (
    <Modal
      open
      onClose={onClose}
      title={food.name}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
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

      <div className="form-row">
        <TextField
          label="Quantity"
          type="number"
          inputMode="decimal"
          step="1"
          min="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
        <SelectField label="Unit" options={UNIT_OPTIONS} value={unit} onChange={(event) => setUnit(event.target.value)} />
      </div>

      <Segmented
        name="meal-type"
        label="Meal"
        value={mealType}
        onChange={setMealType}
        options={MEAL_TYPES.map((t) => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
      />

      <div className="grid grid-4" style={{ marginTop: 4 }}>
        <Stat label="Calories" value={formatNumber(scaled.calories)} />
        <Stat label="Protein" value={formatNumber(scaled.protein_g, 1)} unit="g" />
        <Stat label="Carbs" value={formatNumber(scaled.carbs_g, 1)} unit="g" />
        <Stat label="Fat" value={formatNumber(scaled.fat_g, 1)} unit="g" />
      </div>
    </Modal>
  );
}

const EMPTY_FOOD = {
  name: '', emoji: '', serving_size: '100', serving_unit: 'g',
  calories: '', protein_g: '', carbs_g: '', fat_g: ''
};

function CustomFoodModal({ open, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(EMPTY_FOOD);
  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  const fieldError = (name) => error?.fieldErrors?.[name];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a custom food"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || !form.name || form.calories === ''}
            onClick={() =>
              onSubmit(
                Object.fromEntries(
                  Object.entries(form).filter(([, value]) => value !== '')
                )
              )
            }
          >
            {submitting ? <Spinner label="Saving" /> : 'Save food'}
          </button>
        </>
      }
    >
      {error && <ErrorBanner error={error} />}
      <p className="card-subtitle">
        Enter the values per serving below — they are stored only on your account.
      </p>

      <TextField label="Name" value={form.name} onChange={update('name')} error={fieldError('name')} />

      <div className="form-row">
        <TextField label="Emoji (optional)" value={form.emoji} onChange={update('emoji')} maxLength={4} />
        <SelectField label="Unit" options={UNIT_OPTIONS} value={form.serving_unit} onChange={update('serving_unit')} />
      </div>

      <div className="form-row">
        <TextField label="Serving size" type="number" min="1" value={form.serving_size} onChange={update('serving_size')} error={fieldError('serving_size')} />
        <TextField label="Calories" type="number" min="0" value={form.calories} onChange={update('calories')} error={fieldError('calories')} />
      </div>

      <div className="form-row">
        <TextField label="Protein (g)" type="number" min="0" step="0.1" value={form.protein_g} onChange={update('protein_g')} error={fieldError('protein_g')} />
        <TextField label="Carbs (g)" type="number" min="0" step="0.1" value={form.carbs_g} onChange={update('carbs_g')} error={fieldError('carbs_g')} />
      </div>

      <TextField label="Fat (g)" type="number" min="0" step="0.1" value={form.fat_g} onChange={update('fat_g')} error={fieldError('fat_g')} />
    </Modal>
  );
}
