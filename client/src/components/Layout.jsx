import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/auth-context.js';
import { formatMastheadDate } from '../lib/format.js';
import { BrandMark } from './BrandMark.jsx';
import { Icon } from './Icon.jsx';

// The navigation reads as a table of contents: numbered entries, no icons.
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/log', label: 'Food log' },
  { to: '/workouts', label: 'Training' },
  { to: '/progress', label: 'Progress' },
  { to: '/goals', label: 'Goals' },
  { to: '/calculator', label: 'TDEE calculator' },
  { to: '/settings', label: 'Settings' }
];

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/log': 'Food log',
  '/workouts': 'Training',
  '/progress': 'Progress',
  '/goals': 'Goals',
  '/calculator': 'TDEE calculator',
  '/settings': 'Settings'
};

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigating on mobile should dismiss the drawer.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const initials = (user?.name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  const today = formatMastheadDate(new Date());

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
        <div className="sidebar-brand">
          <BrandMark size={46} tone="plates" />
          <div>
            <div className="sidebar-brand-name">FitTrack</div>
            <div className="sidebar-brand-sub">Pro</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {NAV_ITEMS.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-item-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-avatar" aria-hidden="true">{initials}</span>
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={logout}>
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="app-main">
        <header className="masthead">
          <div className="masthead-inner">
            <button
              type="button"
              className="menu-btn"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-expanded={sidebarOpen}
              aria-controls="sidebar"
              aria-label="Toggle navigation"
            >
              <Icon name="more" size={22} />
            </button>
            <h1 className="masthead-title">{PAGE_TITLES[location.pathname] ?? 'FitTrack'}</h1>
            <p className="masthead-date">
              <span>{today.weekday}</span>
              <b>{today.date}</b>
            </p>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
