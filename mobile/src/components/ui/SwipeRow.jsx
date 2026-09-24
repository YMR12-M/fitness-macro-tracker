// A list row that can be swiped left to delete.
//
// This is the gesture a phone user reaches for first, so the app answers it —
// but never *only* answers it. Every SwipeRow also renders the same delete
// button a tap can reach, because a swipe is undiscoverable, impossible with a
// keyboard, and awkward with a screen reader or a motor impairment. The
// gesture is a shortcut for people who already know it; the button is the
// interface.
import { useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { haptic } from '../../lib/haptics.js';

/** Past this the swipe commits on release; short of it the row springs back. */
const COMMIT_DISTANCE = 96;
const MAX_TRAVEL = 132;

export function SwipeRow({ onDelete, deleteLabel = 'Delete', disabled = false, children }) {
  const [offset, setOffset] = useState(0);
  const [settling, setSettling] = useState(false);
  const drag = useRef(null);
  const armed = useRef(false);

  function onTouchStart(event) {
    if (disabled || event.touches.length !== 1) return;
    drag.current = { x: event.touches[0].clientX, y: event.touches[0].clientY, horizontal: null };
    armed.current = false;
    setSettling(false);
  }

  function onTouchMove(event) {
    if (!drag.current) return;
    const deltaX = event.touches[0].clientX - drag.current.x;
    const deltaY = event.touches[0].clientY - drag.current.y;

    // Decide once, on the first few pixels, whether this gesture belongs to
    // the row or to the page. Re-deciding mid-drag is what makes home-grown
    // swipe rows fight the scroller.
    if (drag.current.horizontal === null) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
      drag.current.horizontal = Math.abs(deltaX) > Math.abs(deltaY);
    }
    if (!drag.current.horizontal) {
      drag.current = null;
      setOffset(0);
      return;
    }

    // Leftward only, and with a hard stop so the row cannot be flung off-screen.
    const travelled = Math.max(-MAX_TRAVEL, Math.min(0, deltaX));
    setOffset(travelled);

    if (!armed.current && travelled <= -COMMIT_DISTANCE) {
      armed.current = true;
      haptic('tap');
    }
  }

  function onTouchEnd() {
    if (!drag.current) return;
    const commit = armed.current;
    drag.current = null;
    armed.current = false;
    setSettling(true);
    setOffset(0);
    if (commit) onDelete();
  }

  return (
    <div className={`swipe${offset !== 0 ? ' is-active' : ''}`}>
      {/* Revealed behind the row as it slides. Hidden from assistive tech: the
          real, reachable control is the button inside `children`. */}
      <div className="swipe-action" aria-hidden="true">
        <Icon name="trash" size={20} />
      </div>
      <div
        className={`swipe-surface${settling ? ' is-settling' : ''}`}
        style={offset ? { translate: `${offset}px 0` } : undefined}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onTransitionEnd={() => setSettling(false)}
      >
        {children}
      </div>
      <span className="visually-hidden">{deleteLabel} is also available as a button in this row.</span>
    </div>
  );
}

/** The tap-reachable half of the pair above. */
export function DeleteButton({ onClick, label, disabled }) {
  return (
    <button type="button" className="btn-icon" aria-label={label} onClick={onClick} disabled={disabled}>
      <Icon name="trash" size={18} />
    </button>
  );
}
