import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

export function Card({ title, subtitle, action, children, className = '', ...rest }) {
  return (
    <section className={`card ${className}`} {...rest}>
      {(title || action) && (
        <header className="card-header">
          <div className="card-heading">
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
      <span className="stat-value numeric">
        {value}
        {unit && <span className="stat-unit"> {unit}</span>}
      </span>
      {delta && <span className={`stat-delta ${deltaTone}`}>{delta}</span>}
    </div>
  );
}

/** A stat in its own card — the unit the horizontal stat rails are built from. */
export function StatTile(props) {
  return (
    <div className="card">
      <Stat {...props} />
    </div>
  );
}

export function EmptyState({ icon = '📭', title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">{icon}</span>
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

/**
 * A full-width row that navigates somewhere — the building block of the More
 * screen and of every "see all" affordance. Rendered as a Link so it keeps
 * browser-native behaviour (long-press, back/forward) that a click handler on
 * a div would throw away.
 */
export function NavRow({ to, icon, iconTone = 'var(--text)', label, hint, trailing }) {
  return (
    <Link to={to} className="list-row list-row-tappable">
      {icon && (
        <span className="menu-icon" style={{ color: iconTone }} aria-hidden="true">
          {typeof icon === 'string' ? <Icon name={icon} size={19} /> : icon}
        </span>
      )}
      <span className="list-row-body">
        <span className="list-row-title">{label}</span>
        {hint && <span className="list-row-meta">{hint}</span>}
      </span>
      {trailing ?? <Icon name="chevron" size={18} className="list-row-chevron" />}
    </Link>
  );
}
