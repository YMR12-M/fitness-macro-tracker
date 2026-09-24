// Shared date schemas. Defined once here instead of being re-declared in every
// module, and validating the *calendar*, not just the shape: "2026-02-31"
// matches /\d{4}-\d{2}-\d{2}/ perfectly well but is not a day that exists, and
// letting it reach MySQL turns a user typo into a 500.
import { z } from 'zod';

const SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/** True only for a date string that names a real day. */
export function isRealDate(value) {
  if (!SHAPE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1) return false;
  // Date.UTC normalises overflow (Feb 31 -> Mar 3), so a round-trip that comes
  // back unchanged is the proof the date was real.
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** Any real calendar date. */
export const isoDate = z.string().refine(isRealDate, 'Use a real date in YYYY-MM-DD format');

/**
 * A real date that is not in the future. Logging a meal or a weigh-in for 2099
 * is always a mistake, and it silently corrupts every trend and average that
 * reads the row afterwards.
 *
 * A day of slack absorbs clients in timezones ahead of the server.
 */
export const pastIsoDate = isoDate.refine((value) => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return value <= tomorrow;
}, 'That date is in the future');
