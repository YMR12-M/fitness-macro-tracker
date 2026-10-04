import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A number that counts to its value instead of appearing — the way a
 * scoreboard does it.
 *
 * It re-targets from wherever it currently is when `target` changes, so
 * logging a meal ticks the "kcal left" figure down rather than snapping it. Pair
 * it with `tabular-nums` (the numeral styles already set it) so the digits do
 * not shuffle sideways as they change. Users who ask for reduced motion get the
 * final value straight away.
 */
export function useCountUp(target, { duration = 850 } = {}) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  const current = useRef(value);

  useEffect(() => {
    if (prefersReducedMotion() || !Number.isFinite(target)) {
      current.current = target;
      setValue(target);
      return undefined;
    }

    const from = current.current;
    const started = performance.now();
    let frame;

    const tick = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = from + (target - from) * eased;
      current.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
