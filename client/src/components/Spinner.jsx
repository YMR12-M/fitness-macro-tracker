export function Spinner({ label }) {
  return (
    <span className="spinner" role="status" aria-label={label ?? 'Loading'} />
  );
}

export function FullPageSpinner({ label = 'Loading' }) {
  return (
    <div className="spinner-page">
      <span className="spinner" role="status" aria-label={label} />
      <span>{label}…</span>
    </div>
  );
}
