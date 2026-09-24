import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Opens a screen's sheet when quick-add routed here asking for it.
 *
 * The tab bar's + button navigates with `state.quickAdd` set to the kind of
 * entry it wants; the screen that owns that kind calls this and gets back a
 * boolean it can feed straight to its sheet. The state is cleared on arrival
 * with a `replace`, so pressing back — or reloading — does not reopen a sheet
 * the user already dismissed.
 */
export function useQuickAdd(kind) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (location.state?.quickAdd !== kind) return;
    setOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, kind, navigate]);

  return [open, setOpen];
}
