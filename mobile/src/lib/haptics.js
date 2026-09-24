/** Haptic feedback, where the device offers it.
 *
 *  Vibration is a confirmation, never the confirmation: every call site also
 *  shows a toast or moves something on screen, so nothing is lost on iOS
 *  Safari (which does not implement the Vibration API) or on a device with
 *  haptics switched off. Calls are silently ignored there.
 *
 *  The durations are deliberately short — a tap should feel like a click, not
 *  a buzz. */

const PATTERNS = {
  /** A control was pressed: tab switch, segment change, chip toggle. */
  tap: 8,
  /** Something was written: a meal logged, a goal saved. */
  success: [14, 36, 14],
  /** Something was removed or refused. */
  warn: [22, 44, 22]
};

export function haptic(kind = 'tap') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(PATTERNS[kind] ?? PATTERNS.tap);
  } catch {
    // A browser that exposes vibrate but refuses it (permissions policy, or a
    // background tab) must not take the interaction down with it.
  }
}
