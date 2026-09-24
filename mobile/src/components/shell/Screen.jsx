import { AppBar } from './AppBar.jsx';
import { Icon } from '../ui/Icon.jsx';
import { usePullToRefresh } from '../../hooks/usePullToRefresh.js';

/**
 * One screen: its app bar, its scrolling body, and its pull-to-refresh.
 *
 * Every feature renders exactly one of these, which is what keeps the bar's
 * title and the screen's own state in the same file rather than in a lookup
 * table somewhere else that has to be kept in step with the router.
 *
 * Pass `onRefresh` and the screen answers a downward pull at the top by
 * running it — omit it and the gesture is left to the browser.
 */
export function Screen({ title, subtitle, back, trailing, onRefresh, standalone = false, children }) {
  const { distance, refreshing, armed } = usePullToRefresh(onRefresh, { enabled: Boolean(onRefresh) });

  return (
    <>
      <AppBar title={title} subtitle={subtitle} back={back} trailing={trailing} />

      {distance > 0 && (
        <div className="ptr" style={{ translate: `0 ${distance * 0.6}px` }} aria-hidden="true">
          <div className={`ptr-dial${armed || refreshing ? ' is-armed' : ''}`}>
            {refreshing ? (
              <span className="spinner" style={{ width: 15, height: 15 }} />
            ) : (
              <Icon name="refresh" size={15} style={{ rotate: `${distance * 3}deg` }} />
            )}
          </div>
        </div>
      )}

      <main className={`screen${standalone ? ' is-standalone' : ''}`}>{children}</main>
    </>
  );
}
