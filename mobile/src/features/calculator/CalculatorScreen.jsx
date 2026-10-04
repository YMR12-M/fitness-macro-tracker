// TDEE calculator. The maths runs on the server (the same module the signup
// flow and the daily targets use), so this screen can never drift out of step
// with the numbers the dashboard measures against.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tdee as tdeeApi, users as usersApi } from '../../api/endpoints.js';
import { useAuth } from '../../auth/auth-context.js';
import { Screen } from '../../components/shell/Screen.jsx';
import { Card, EmptyState, ErrorBanner, Stat } from '../../components/ui/Card.jsx';
import { ChipGroup, NumberField, SelectField } from '../../components/ui/Field.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { useToast } from '../../components/ui/toast-context.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import { formatNumber } from '../../lib/format.js';

const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
];

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary (×1.2)' },
  { value: 'light', label: 'Light — 1-3 sessions/week (×1.375)' },
  { value: 'moderate', label: 'Moderate — 3-5 sessions/week (×1.55)' },
  { value: 'active', label: 'Active — 6-7 sessions/week (×1.725)' },
  { value: 'very_active', label: 'Very active — twice daily (×1.9)' }
];

const GOAL_OPTIONS = [
  { value: 'cut', label: 'Lose fat (−500 kcal)' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'bulk', label: 'Build muscle (+300 kcal)' }
];

function ageFrom(birthDate) {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? String(age) : '';
}

export function CalculatorScreen() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  // Prefill from the profile so the user is not retyping what we already know.
  const [form, setForm] = useState({
    sex: user?.sex ?? 'male',
    weight_kg: '',
    height_cm: user?.height_cm ? String(user.height_cm) : '',
    age: ageFrom(user?.birth_date),
    activity_level: user?.activity_level ?? 'moderate',
    goal_type: user?.goal_type ?? 'maintain'
  });

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  const complete = form.weight_kg !== '' && form.height_cm !== '' && form.age !== '';

  const { data, isFetching, error } = useQuery({
    queryKey: ['tdee', form],
    queryFn: () =>
      tdeeApi.calculate({
        sex: form.sex,
        weight_kg: Number(form.weight_kg),
        height_cm: Number(form.height_cm),
        age: Number(form.age),
        activity_level: form.activity_level,
        goal_type: form.goal_type
      }),
    enabled: complete
  });

  const applyTargets = useMutationWithRefresh({
    mutationFn: () =>
      usersApi.updateProfile({
        sex: form.sex,
        height_cm: Number(form.height_cm),
        activity_level: form.activity_level,
        goal_type: form.goal_type,
        calorie_goal: data.target_calories,
        protein_goal_g: data.macros.protein_g,
        carbs_goal_g: data.macros.carbs_g,
        fat_goal_g: data.macros.fat_g
      }),
    invalidate: [['dashboard'], ['summary'], ['profile']],
    onSuccess: ({ profile }) => {
      updateUser(profile);
      toast.success('Targets updated — your dashboard now measures against these');
    }
  });

  return (
    <Screen title="TDEE calculator" subtitle="Mifflin-St Jeor equation" back="/more">
      <Card title="Your details">
        <div className="stack">
          <ChipGroup
            name="sex"
            label="Sex"
            value={form.sex}
            onChange={(value) => setForm((f) => ({ ...f, sex: value }))}
            options={SEX_OPTIONS}
            multiline={false}
          />

          <div className="field-row">
            <NumberField label="Age" decimal={false} min="13" max="120" value={form.age} onChange={update('age')} />
            <NumberField
              label="Weight (kg)"
              step="0.1"
              min="25"
              max="400"
              value={form.weight_kg}
              onChange={update('weight_kg')}
            />
          </div>

          <NumberField
            label="Height (cm)"
            step="0.1"
            min="80"
            max="260"
            value={form.height_cm}
            onChange={update('height_cm')}
          />

          <SelectField
            label="Activity level"
            options={ACTIVITY_OPTIONS}
            value={form.activity_level}
            onChange={update('activity_level')}
          />
          <SelectField label="Goal" options={GOAL_OPTIONS} value={form.goal_type} onChange={update('goal_type')} />
        </div>
      </Card>

      <Card title="Your numbers" subtitle={isFetching ? 'Calculating…' : 'Daily energy and macro targets'}>
        {!complete ? (
          <EmptyState icon="calculator" title="Fill in your details">
            Enter your age, weight and height and the calculation runs automatically.
          </EmptyState>
        ) : error ? (
          <ErrorBanner error={error} />
        ) : !data ? (
          <Spinner label="Calculating" />
        ) : (
          <>
            <div className="grid-3">
              <Stat label="BMR" value={formatNumber(data.bmr)} unit="kcal" />
              <Stat label="TDEE" value={formatNumber(data.tdee)} unit="kcal" />
              <Stat label="Target" value={formatNumber(data.target_calories)} unit="kcal" />
            </div>

            <p className="screen-section-title" style={{ marginTop: 18, marginBottom: 10 }}>
              Macro targets
            </p>
            <div className="grid-3">
              <Stat
                label="Protein"
                value={formatNumber(data.macros.protein_g)}
                unit={`g · ${data.macro_split.protein_pct}%`}
              />
              <Stat label="Carbs" value={formatNumber(data.macros.carbs_g)} unit={`g · ${data.macro_split.carbs_pct}%`} />
              <Stat label="Fat" value={formatNumber(data.macros.fat_g)} unit={`g · ${data.macro_split.fat_pct}%`} />
            </div>

            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginTop: 18 }}
              onClick={() => applyTargets.mutate()}
              disabled={applyTargets.isPending}
            >
              {applyTargets.isPending ? <Spinner label="Applying" /> : 'Use these as my daily targets'}
            </button>
          </>
        )}
      </Card>

      <Card title="How this is calculated">
        <div className="stack">
          <p className="card-subtitle">
            <strong>BMR</strong> uses the Mifflin-St Jeor equation — the resting rate with the best validated accuracy
            across body compositions:{' '}
            <code>
              (10 × kg) + (6.25 × cm) − (5 × age) {form.sex === 'female' ? '− 161' : '+ 5'}
            </code>
            .
          </p>
          <p className="card-subtitle">
            <strong>TDEE</strong> multiplies that by your activity level, then your goal adjusts it: −500 kcal to lose
            fat (roughly 0.5 kg a week), +300 kcal to build muscle.
          </p>
          <p className="card-subtitle">
            <strong>Macros</strong> set protein from body weight ({form.goal_type === 'cut' ? '2.2' : '1.8'} g/kg —
            higher in a deficit to protect lean mass), fat at 25% of intake, and carbohydrate takes the remainder.
          </p>
          <p className="field-hint">
            These are well-established starting estimates, not medical advice. Adjust based on what the scale and the
            mirror actually do over a few weeks.
          </p>
        </div>
      </Card>
    </Screen>
  );
}
