import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/auth-context.js';
import { formatLongDate } from '../lib/format.js';
import { BrandMark } from './BrandMark.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/log', label: 'Food log', icon: '🍽️' },
  { to: '/workouts', label: 'Training', icon: '🏋️' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/goals', label: 'Goals', icon: '🎯' },
  { to: '/calculator', label: 'TDEE calculator', icon: '🧮' },
  { to: '/settings', label: 'Settings', icon: '⚙️' }
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

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">
            <BrandMark size={22} />
          </span>
          <div>
            <div className="sidebar-brand-name">FitTrack</div>
            <div className="sidebar-brand-sub">Pro</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-item-icon" aria-hidden="true">{item.icon}</span>
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
        <header className="topbar">
          <button
            type="button"
            className="menu-btn"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <div>
            <h1 className="topbar-title">{PAGE_TITLES[location.pathname] ?? 'FitTrack'}</h1>
            <p className="topbar-date">{formatLongDate(new Date())}</p>
          </div>
          <div className="topbar-spacer" />
        </header>

        <Outlet />
      </div>
    </div>
  );
}
