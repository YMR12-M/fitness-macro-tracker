// The signed-in shell: a scrolling screen with a fixed tab bar under it, plus
// the quick-add sheet the tab bar's + button opens.
//
// Each feature supplies its own app bar through <Screen>, so nothing here has
// to hold a title lookup that could drift out of step with the router.
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { TabBar } from './TabBar.jsx';
import { ActionSheet } from '../ui/ActionSheet.jsx';
import { WaterSheet } from '../../features/water/WaterSheet.jsx';

export function AppShell() {
  const navigate = useNavigate();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [waterOpen, setWaterOpen] = useState(false);

  /**
   * Quick-add routes to the screen that owns each kind of entry and asks it to
   * open its sheet, rather than duplicating four forms up here. The screens
   * read `location.state.quickAdd` on arrival. Water is the exception — it has
   * no screen of its own, so its sheet lives here.
   */
  const openOn = (path, kind) => navigate(path, { state: { quickAdd: kind } });

  const actions = [
    { label: 'Food', hint: 'search the catalog', icon: '🍽️', tone: 'var(--green)', onSelect: () => openOn('/log', 'food') },
    { label: 'Water', hint: 'a glass or a bottle', icon: '💧', tone: 'var(--blue)', onSelect: () => setWaterOpen(true) },
    { label: 'Workout', hint: "today's session", icon: '🏋️', tone: 'var(--orange)', onSelect: () => openOn('/train', 'workout') },
    { label: 'Weight', hint: 'a weigh-in', icon: '⚖️', tone: 'var(--purple)', onSelect: () => openOn('/progress', 'weight') }
  ];

  return (
    <div className="shell">
      <Outlet />

      <TabBar quickAddOpen={quickAddOpen} onQuickAdd={() => setQuickAddOpen(true)} />

      <ActionSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        title="Quick add"
        actions={actions}
      />

      <WaterSheet open={waterOpen} onClose={() => setWaterOpen(false)} />
    </div>
  );
}
