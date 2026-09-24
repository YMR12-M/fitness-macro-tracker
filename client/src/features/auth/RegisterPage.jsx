// Signup doubles as onboarding: the body stats collected here are what the
// server uses to compute real starting calorie and macro targets, so a new
// account is never staring at a generic 2000 kcal placeholder.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context.js';
import { SelectField, TextField } from '../../components/Field.jsx';
import { ErrorBanner } from '../../components/Card.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { BrandMark } from '../../components/BrandMark.jsx';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary — desk job, little exercise' },
  { value: 'light', label: 'Light — 1-3 sessions a week' },
  { value: 'moderate', label: 'Moderate — 3-5 sessions a week' },
  { value: 'active', label: 'Active — 6-7 sessions a week' },
  { value: 'very_active', label: 'Very active — training twice a day' }
];

const GOAL_OPTIONS = [
  { value: 'cut', label: 'Lose fat (−500 kcal)' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'bulk', label: 'Build muscle (+300 kcal)' }
];

const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    sex: 'male',
    birth_date: '',
    height_cm: '',
    weight_kg: '',
    activity_level: 'moderate',
    goal_type: 'maintain'
  });

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    // Empty optional fields must be omitted, not sent as '' — the API validates types.
    const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''));
    payload.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
      await register(payload);
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(submitError);
      setSubmitting(false);
    }
  }

  const fieldError = (name) => error?.fieldErrors?.[name];

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="sidebar-brand-mark">
            <BrandMark size={24} />
          </span>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">
            Your body stats set your starting calorie and macro targets. You can change them any time.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <ErrorBanner error={error} />}

          <TextField
            label="Name"
            name="name"
            autoComplete="name"
            required
            value={form.name}
            onChange={update('name')}
            error={fieldError('name')}
          />

          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={update('email')}
            error={fieldError('email')}
            placeholder="you@example.com"
          />

          <TextField
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={update('password')}
            error={fieldError('password')}
            hint="At least 8 characters, including a letter and a number."
          />

          <div className="auth-divider">Body stats</div>

          <div className="form-row">
            <SelectField label="Sex" options={SEX_OPTIONS} value={form.sex} onChange={update('sex')} error={fieldError('sex')} />
            <TextField
              label="Date of birth"
              type="date"
              value={form.birth_date}
              onChange={update('birth_date')}
              error={fieldError('birth_date')}
            />
          </div>

          <div className="form-row">
            <TextField
              label="Height (cm)"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="80"
              max="260"
              value={form.height_cm}
              onChange={update('height_cm')}
              error={fieldError('height_cm')}
            />
            <TextField
              label="Weight (kg)"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="25"
              max="400"
              value={form.weight_kg}
              onChange={update('weight_kg')}
              error={fieldError('weight_kg')}
              hint="Logged as your first weight entry."
            />
          </div>

          <SelectField
            label="Activity level"
            options={ACTIVITY_OPTIONS}
            value={form.activity_level}
            onChange={update('activity_level')}
            error={fieldError('activity_level')}
          />

          <SelectField
            label="Goal"
            options={GOAL_OPTIONS}
            value={form.goal_type}
            onChange={update('goal_type')}
            error={fieldError('goal_type')}
          />

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? <Spinner label="Creating account" /> : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
