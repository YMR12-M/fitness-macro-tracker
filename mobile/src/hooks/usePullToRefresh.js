import { useCallback, useEffect, useRef, useState } from 'react';
import { haptic } from '../lib/haptics.js';

const THRESHOLD = 72; // how far to pull before the gesture arms
const MAX_PULL = 110; // the dial stops travelling here, however hard you pull
const RESISTANCE = 0.5; // the pull moves half as far as the finger does

/**
 * Pull down from the top of a screen to refetch it — the gesture every phone
 * user tries first, and which a web app otherwise answers by doing nothing.
 *
 * Only engages when the page is already scrolled to the very top and the first
 * movement of the gesture is downward; a horizontal swipe through a rail, or a
 * downward drag that starts mid-page, is left alone. Nothing here calls
 * preventDefault on a passive listener, so normal scrolling keeps its
 * off-main-thread path.
 */
export function usePullToRefresh(onRefresh, { enabled = true } = {}) {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef(0);
  const startX = useRef(0);
  const tracking = useRef(false);
  const armed = useRef(false);
  // Held in a ref so the listeners below never need re-binding when the caller
  // passes a new inline callback on every render.
  const handler = useRef(onRefresh);
  handler.current = onRefresh;

  const reset = useCallback(() => {
    tracking.current = false;
    armed.current = false;
    setDistance(0);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const onTouchStart = (event) => {
      if (refreshing || event.touches.length !== 1 || window.scrollY > 0) return;
      startY.current = event.touches[0].clientY;
      startX.current = event.touches[0].clientX;
      tracking.current = true;
      armed.current = false;
    };

    const onTouchMove = (event) => {
      if (!tracking.current) return;
      const deltaY = event.touches[0].clientY - startY.current;
      const deltaX = Math.abs(event.touches[0].clientX - startX.current);

      // Scrolling back up, or swiping sideways: this is not a pull.
      if (deltaY <= 0 || deltaX > Math.abs(deltaY)) {
        reset();
        return;
      }

      const pulled = Math.min(deltaY * RESISTANCE, MAX_PULL);
      setDistance(pulled);

      // One tick the moment the gesture crosses the threshold, so you can feel
      // that letting go will do something.
      if (!armed.current && pulled >= THRESHOLD) {
        armed.current = true;
        haptic('tap');
      }
    };

    const onTouchEnd = async () => {
      if (!tracking.current) return;
      const shouldRefresh = armed.current;
      tracking.current = false;
      armed.current = false;

      if (!shouldRefresh) {
        setDistance(0);
        return;
      }

      setRefreshing(true);
      setDistance(THRESHOLD);
      try {
        await handler.current?.();
      } finally {
        setRefreshing(false);
        setDistance(0);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', reset);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', reset);
    };
  }, [enabled, refreshing, reset]);

  return { distance, refreshing, armed: distance >= THRESHOLD };
}
