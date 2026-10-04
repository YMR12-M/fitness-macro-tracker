import { Icon, hasIcon } from './Icon.jsx';

export function Card({ title, subtitle, action, children, className = '', ...rest }) {
  return (
    <section className={`card ${className}`} {...rest}>
      {(title || action) && (
        <header className="card-header">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, unit, delta, deltaTone = 'flat' }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {value}
        {unit && <span className="stat-unit"> {unit}</span>}
      </span>
      {delta && <span className={`stat-delta ${deltaTone}`}>{delta}</span>}
    </div>
  );
}

/** `icon` is the name of one of the drawn icons, or a literal glyph. */
export function EmptyState({ icon = 'plate', title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">
        {hasIcon(icon) ? <Icon name={icon} size={28} /> : icon}
      </span>
      {title && <p className="empty-state-title">{title}</p>}
      {children && <p className="empty-state-text">{children}</p>}
      {action}
    </div>
  );
}

export function ErrorBanner({ error, children }) {
  const message = children ?? error?.message ?? 'Something went wrong';
  return (
    <p className="error-banner" role="alert">
      {message}
    </p>
  );
}

export function Progress({ value, max = 100, color }) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress-fill" style={{ width: `${percent}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}
