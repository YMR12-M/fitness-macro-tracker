// The hub for everything the four-tab bar cannot hold.
//
// The desktop sidebar lists all seven destinations at once; a tab bar that did
// the same would put four of them out of thumb reach and shrink every target
// below the size a finger reliably hits. Goals, the calculator and settings are
// consulted occasionally rather than daily, so they live one tap behind the
// account button in the app bar — which lands here.
import { useQuery } from '@tanstack/react-query';
import { summary, users as usersApi } from '../../api/endpoints.js';
import { useAuth } from '../../auth/auth-context.js';
import { Screen } from '../../components/shell/Screen.jsx';
import { Card, NavRow, StatTile } from '../../components/ui/Card.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { BrandMark } from '../../components/BrandMark.jsx';
import { formatNumber, initialsOf } from '../../lib/format.js';

export function MoreScreen() {
  const { user, logout } = useAuth();

  // Cheap because the dashboard query is already warm from the Today tab; this
  // reads the cache rather than firing a second request in the common case.
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: summary.dashboard });
  const streak = data?.streak;
  const goals = data?.goals ?? [];

  return (
    <Screen title="More" back="/">
      <div className="profile-head">
        <span className="profile-avatar" aria-hidden="true">
          {initialsOf(user?.name)}
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="profile-name">{user?.name}</div>
          <div className="profile-email">{user?.email}</div>
        </div>
      </div>

      <div className="rail">
        <StatTile
          label="Streak"
          value={streak?.current ?? '—'}
          unit={streak?.current === 1 ? 'day' : 'days'}
        />
        <StatTile label="Active goals" value={goals.length} />
        <StatTile
          label="Calorie target"
          value={formatNumber(data?.today?.targets?.calories ?? 0)}
          unit="kcal"
        />
      </div>

      <p className="screen-section-title">Plan</p>
      <div className="list">
        <NavRow to="/goals" icon="target" iconTone="var(--green)" label="Goals" hint="Targets and how far you've come" />
        <NavRow
          to="/calculator"
          icon="calculator"
          iconTone="var(--blue)"
          label="TDEE calculator"
          hint="Recompute your energy and macro targets"
        />
      </div>

      <p className="screen-section-title">Account</p>
      <div className="list">
        <NavRow
          to="/settings"
          icon="settings"
          iconTone="var(--text2)"
          label="Settings"
          hint="Profile, targets, appearance"
        />

        <a className="list-row list-row-tappable" href={usersApi.exportUrl()} download>
          <span className="menu-icon" style={{ color: 'var(--text2)' }} aria-hidden="true">
            <Icon name="download" size={19} />
          </span>
          <span className="list-row-body">
            <span className="list-row-title">Export my data</span>
            <span className="list-row-meta">Everything this account holds, as JSON</span>
          </span>
          <Icon name="chevron" size={18} className="list-row-chevron" />
        </a>

        <button type="button" className="list-row list-row-tappable" onClick={logout}>
          <span className="menu-icon" style={{ color: 'var(--red)' }} aria-hidden="true">
            <Icon name="logout" size={19} />
          </span>
          <span className="list-row-body">
            <span className="list-row-title">Sign out</span>
            <span className="list-row-meta">Ends this session on this device</span>
          </span>
        </button>
      </div>

      <Card className="card-flush">
        <div
          className="empty-state"
          style={{ paddingTop: 10, paddingBottom: 0, color: 'var(--text3)', gap: 6 }}
        >
          <span style={{ color: 'var(--green)' }}>
            <BrandMark size={26} />
          </span>
          <p style={{ fontSize: 12 }}>FitTrack Pro — mobile</p>
          <p style={{ fontSize: 11 }}>
            Nutrition data from USDA FoodData Central. Every figure is computed from what you logged.
          </p>
        </div>
      </Card>
    </Screen>
  );
}
