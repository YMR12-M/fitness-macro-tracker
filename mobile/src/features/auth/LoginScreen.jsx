import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context.js';
import { TextField } from '../../components/ui/Field.jsx';
import { ErrorBanner } from '../../components/ui/Card.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { BrandMark } from '../../components/BrandMark.jsx';

export function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(form);
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(submitError);
      setSubmitting(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth-brand">
        <span className="auth-mark">
          <BrandMark size={30} />
        </span>
        <h1 className="auth-title">FitTrack Pro</h1>
        <p className="auth-subtitle">Pick up where you left off.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error && <ErrorBanner error={error} />}

        <TextField
          label="Email"
          type="email"
          name="email"
          // Together these give the phone keyboard an @ key, no autocapitalise
          // and no autocorrect — typing an address on a touch keyboard is
          // otherwise a fight with the software.
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          required
          value={form.email}
          onChange={update('email')}
          error={error?.fieldErrors?.email}
          placeholder="you@example.com"
        />

        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={update('password')}
          error={error?.fieldErrors?.password}
        />

        <div className="auth-actions">
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? <Spinner label="Signing in" /> : 'Sign in'}
          </button>
          <p className="auth-footer">
            No account yet? <Link to="/register">Create one</Link>
          </p>
        </div>
      </form>
    </main>
  );
}
