// Signup doubles as onboarding: the body stats collected here are what the
// server uses to compute real starting calorie and macro targets, so a new
// account is never staring at a generic 2000 kcal placeholder.
//
// Where the desktop client asks for all ten fields on one page, this asks in
// three passes. A ten-field form on a phone is a scroll with a keyboard
// covering half of it and no sense of how much is left; three short steps with
// a progress bar answer both. The payload sent at the end is identical.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context.js';
import { ChipGroup, SelectField, TextField } from '../../components/ui/Field.jsx';
import { ErrorBanner } from '../../components/ui/Card.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { AuthPoster } from '../../components/AuthPoster.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { haptic } from '../../lib/haptics.js';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary — desk job, little exercise' },
  { value: 'light', label: 'Light — 1-3 sessions a week' },
  { value: 'moderate', label: 'Moderate — 3-5 sessions a week' },
  { value: 'active', label: 'Active — 6-7 sessions a week' },
  { value: 'very_active', label: 'Very active — training twice a day' }
];

const GOAL_OPTIONS = [
  { value: 'cut', label: 'Lose fat', icon: 'flame', hint: '−500 kcal a day, about 0.5 kg a week' },
  { value: 'maintain', label: 'Maintain', icon: 'scale', hint: 'Eat at your daily energy expenditure' },
  { value: 'bulk', label: 'Build muscle', icon: 'train', hint: '+300 kcal a day, a lean surplus' }
];

const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
];

const STEPS = [
  { title: 'Create your account', subtitle: 'Two minutes, and nothing you cannot change later.' },
  { title: 'Your body stats', subtitle: 'These set your starting calorie and macro targets.' },
  { title: 'Your plan', subtitle: 'How hard you train, and what you are training for.' }
];

const EMPTY = {
  name: '',
  email: '',
  password: '',
  sex: 'male',
  birth_date: '',
  height_cm: '',
  weight_kg: '',
  activity_level: 'moderate',
  goal_type: 'maintain'
};

export function RegisterScreen() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  const setField = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));
  const fieldError = (name) => error?.fieldErrors?.[name];

  // Only the first step has fields the API insists on. Steps 2 and 3 are
  // optional server-side, so they can be moved through without blocking.
  const canAdvance = step !== 0 || (form.name.trim().length >= 2 && form.email.includes('@') && form.password.length >= 8);

  function back() {
    haptic('tap');
    if (step === 0) navigate('/login');
    else setStep((s) => s - 1);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (step < STEPS.length - 1) {
      haptic('tap');
      setStep((s) => s + 1);
      window.scrollTo(0, 0);
      return;
    }

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
      // A rejected field is almost always one from step 1 (a taken email, a
      // weak password), and leaving the user on step 3 hides the message that
      // explains it.
      if (Object.keys(submitError.fieldErrors ?? {}).some((key) => key in { name: 1, email: 1, password: 1 })) {
        setStep(0);
      }
    }
  }

  const current = STEPS[step];

  return (
    <main className="auth">
      <AuthPoster compact />

      <div className="auth-body">
        <div className="row" style={{ marginBottom: 10 }}>
          <button type="button" className="appbar-btn" onClick={back} aria-label="Back">
            <Icon name="back" size={22} />
          </button>
        </div>

        <div className="steps" role="group" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((_, index) => (
            <span key={index} className={`steps-bar${index <= step ? ' is-done' : ''}`}>
              <span className="steps-bar-fill" />
            </span>
          ))}
        </div>

        <div className="auth-brand">
          <h1 className="auth-title">{current.title}</h1>
          <p className="auth-subtitle">{current.subtitle}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <ErrorBanner error={error} />}

          {step === 0 && (
            <>
              <TextField
                label="Name"
                name="name"
                autoComplete="name"
                autoCapitalize="words"
                required
                value={form.name}
                onChange={update('name')}
                error={fieldError('name')}
              />
              <TextField
                label="Email"
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
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
            </>
          )}

          {step === 1 && (
            <>
              <ChipGroup
                name="sex"
                label="Sex"
                value={form.sex}
                onChange={setField('sex')}
                options={SEX_OPTIONS}
                multiline={false}
              />
              <TextField
                label="Date of birth"
                type="date"
                value={form.birth_date}
                onChange={update('birth_date')}
                error={fieldError('birth_date')}
              />
              <div className="field-row">
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
                />
              </div>
              <p className="field-hint">
                Your weight is logged as your first entry, so the trend line starts from today. You can skip this and
                fill it in from Settings later — your targets will just start from a default until you do.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <SelectField
                label="Activity level"
                options={ACTIVITY_OPTIONS}
                value={form.activity_level}
                onChange={update('activity_level')}
                error={fieldError('activity_level')}
              />

              <div className="field">
                <span className="field-label" id="goal-label">Goal</span>
                <div className="stack-sm" role="group" aria-labelledby="goal-label">
                  {GOAL_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="actionsheet-item"
                      aria-pressed={form.goal_type === option.value}
                      onClick={() => {
                        haptic('tap');
                        setForm((f) => ({ ...f, goal_type: option.value }));
                      }}
                    >
                      <span className="actionsheet-icon" aria-hidden="true">
                        <Icon name={option.icon} size={24} />
                      </span>
                      <span>
                        <span className="actionsheet-label">{option.label}</span>
                        <span className="actionsheet-hint" style={{ display: 'block' }}>{option.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="auth-actions">
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !canAdvance}>
              {submitting ? (
                <Spinner label="Creating account" />
              ) : step < STEPS.length - 1 ? (
                'Continue'
              ) : (
                'Create account'
              )}
            </button>

            {step === 0 && (
              <p className="auth-footer">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
