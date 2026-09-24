import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context.js';
import { TextField } from '../../components/Field.jsx';
import { ErrorBanner } from '../../components/Card.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { BrandMark } from '../../components/BrandMark.jsx';

export function LoginPage() {
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
    <main className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="sidebar-brand-mark">
            <BrandMark size={24} />
          </span>
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">Pick up where you left off.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <ErrorBanner error={error} />}

          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
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

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? <Spinner label="Signing in" /> : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </div>
    </main>
  );
}
