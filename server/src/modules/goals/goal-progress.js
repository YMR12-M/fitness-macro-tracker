// Goal progress maths. Pure functions with no database or config dependency, so
// the rules can be reasoned about — and tested — on their own.

/**
 * Percentage of the distance travelled from where the user started to the
 * target. Works identically for "get to a 100 kg bench" and "get down to 77 kg":
 * `direction` says which way counts as forward, which replaces the old guesswork
 * about whether a lower number was an improvement.
 *
 * A goal with no distance to cover (start already at target) reads as complete.
 */
export function progressPercent(goal) {
  const start = Number(goal.start_value);
  const current = Number(goal.current_value);
  const target = Number(goal.target_value);

  const span = Math.abs(target - start);
  if (span === 0) return 100;

  const travelled = goal.direction === 'decrease' ? start - current : current - start;
  return Math.max(0, Math.min(100, Math.round((travelled / span) * 100)));
}

/** Whether the current value has met or passed the target. */
export const isReached = (goal) =>
  goal.direction === 'decrease'
    ? Number(goal.current_value) <= Number(goal.target_value)
    : Number(goal.current_value) >= Number(goal.target_value);

/** Whole days until the deadline; negative once it has passed, null if none. */
export function daysRemaining(deadline, now = Date.now()) {
  if (!deadline) return null;
  return Math.ceil((new Date(`${String(deadline).slice(0, 10)}T00:00:00Z`) - now) / (1000 * 60 * 60 * 24));
}
