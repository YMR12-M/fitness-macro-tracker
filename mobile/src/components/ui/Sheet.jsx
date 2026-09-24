// Bottom sheet — the mobile counterpart to the desktop client's centred modal.
//
// A phone dialog belongs at the bottom of the screen, where the thumb is, and
// it has to be dismissible by dragging it back down: that gesture is how every
// native sheet on both platforms closes, and a sheet that ignores it feels
// broken even when a close button is right there.
//
// Accessibility is unchanged from the desktop Modal: focus moves in on open and
// returns on close, Escape dismisses, Tab is trapped inside, and the backdrop
// is inert to screen readers while it is up. The drag is an addition, never the
// only way out — the ✕ and the backdrop both still close it.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';
import { haptic } from '../../lib/haptics.js';

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/** Drag further than this, or flick faster than this, and the sheet closes. */
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.55; // px per ms

export function Sheet({ open, onClose, title, children, footer, describedBy }) {
  const sheetRef = useRef(null);
  const previouslyFocused = useRef(null);

  // Live drag offset in px. Null means "not dragging", which is also what lets
  // the CSS open animation run without a transform fighting it.
  const [offset, setOffset] = useState(null);
  const [settling, setSettling] = useState(false);
  const drag = useRef(null);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = sheetRef.current?.querySelectorAll(FOCUSABLE);
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    // Defer so the sheet is in the DOM before we reach into it.
    const timer = setTimeout(() => {
      const focusable = sheetRef.current?.querySelector(FOCUSABLE);
      (focusable ?? sheetRef.current)?.focus({ preventScroll: true });
    }, 0);

    // Freeze the page behind the sheet. position:fixed rather than
    // overflow:hidden because iOS Safari ignores the latter on <body> and
    // happily scrolls the page under an open sheet.
    const scrollY = window.scrollY;
    const { style } = document.body;
    const saved = { position: style.position, top: style.top, width: style.width };
    style.position = 'fixed';
    style.top = `-${scrollY}px`;
    style.width = '100%';

    return () => {
      clearTimeout(timer);
      style.position = saved.position;
      style.top = saved.top;
      style.width = saved.width;
      window.scrollTo(0, scrollY);
      previouslyFocused.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  // A sheet reopened after being dragged away must start from the bottom again.
  useEffect(() => {
    if (!open) {
      setOffset(null);
      setSettling(false);
      drag.current = null;
    }
  }, [open]);

  function onPointerDown(event) {
    // Only the primary pointer, and never a secondary touch landing mid-drag.
    if (!event.isPrimary) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { startY: event.clientY, lastY: event.clientY, lastTime: event.timeStamp, velocity: 0 };
    setSettling(false);
    setOffset(0);
  }

  function onPointerMove(event) {
    if (!drag.current) return;
    const elapsed = event.timeStamp - drag.current.lastTime;
    if (elapsed > 0) {
      drag.current.velocity = (event.clientY - drag.current.lastY) / elapsed;
      drag.current.lastY = event.clientY;
      drag.current.lastTime = event.timeStamp;
    }
    // Downward only. Dragging up rubber-bands to a stop rather than lifting the
    // sheet off the bottom edge and exposing the page behind it.
    setOffset(Math.max(0, event.clientY - drag.current.startY));
  }

  function onPointerUp() {
    if (!drag.current) return;
    const { velocity } = drag.current;
    const travelled = offset ?? 0;
    drag.current = null;

    if (travelled > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
      haptic('tap');
      onClose();
      return;
    }

    // Not far enough: spring back to the top of its travel.
    setSettling(true);
    setOffset(0);
  }

  if (!open) return null;

  const dragging = drag.current !== null;

  return createPortal(
    <>
      <div
        className="sheet-backdrop"
        onMouseDown={(event) => {
          // Only a press that starts on the backdrop closes — a drag that ends
          // there after starting inside a field should not.
          if (event.target === event.currentTarget) onClose();
        }}
      />
      <div
        className={`sheet${dragging ? ' is-dragging' : ''}${settling ? ' is-settling' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby={describedBy}
        ref={sheetRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={offset ? { translate: `0 ${offset}px` } : undefined}
        onTransitionEnd={() => setSettling(false)}
      >
        <div
          className="sheet-grip"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          // The handle is decorative: it duplicates the ✕ below it, which is
          // the control assistive technology is pointed at.
          aria-hidden="true"
        />

        <header className="sheet-header">
          <h2 className="sheet-title">{title}</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="sheet-body">{children}</div>

        {footer && <footer className="sheet-footer">{footer}</footer>}
      </div>
    </>,
    document.body
  );
}
