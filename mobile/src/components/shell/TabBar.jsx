import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon.jsx';
import { haptic } from '../../lib/haptics.js';

/**
 * The four primary destinations, with the quick-add button straddling the
 * middle.
 *
 * Four and not seven: the desktop sidebar's other three entries — goals, the
 * TDEE calculator and settings — are consulted occasionally, not daily, and a
 * tab bar that tries to hold everything ends up holding nothing you can hit.
 * They live one tap away behind the account button in the app bar, which
 * routes to the More screen.
 */
const TABS = [
  { to: '/', label: 'Today', icon: 'today', end: true },
  { to: '/log', label: 'Log', icon: 'log' },
  { to: '/train', label: 'Train', icon: 'train' },
  { to: '/progress', label: 'Progress', icon: 'progress' }
];

export function TabBar({ onQuickAdd, quickAddOpen }) {
  const [first, second, third, fourth] = TABS;

  return (
    <nav className="tabbar" aria-label="Primary">
      <Tab {...first} />
      <Tab {...second} />

      <div className="tab-fab-slot">
        <button
          type="button"
          className={`tab-fab${quickAddOpen ? ' is-open' : ''}`}
          onClick={() => {
            haptic('tap');
            onQuickAdd();
          }}
          aria-expanded={quickAddOpen}
          aria-label="Quick add"
        >
          <Icon name="plus" size={26} strokeWidth={2.8} className="tab-fab-icon" />
        </button>
      </div>

      <Tab {...third} />
      <Tab {...fourth} />
    </nav>
  );
}

function Tab({ to, label, icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
      onClick={() => haptic('tap')}
    >
      {({ isActive }) => (
        <>
          <Icon name={icon} size={24} strokeWidth={isActive ? 2.4 : 2} className="tab-icon" />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
