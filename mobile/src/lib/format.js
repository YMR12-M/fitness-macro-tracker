/** Display formatting. Locale-aware, and tolerant of the nulls the API returns.
 *
 *  Everything above the divider matches client/src/lib/format.js. Below it are
 *  the helpers only the mobile shell needs — short labels for a 52px-wide day
 *  cell, and the relative wording ("Today", "Yesterday") that a phone header
 *  has room for where a desktop table column does not. */

const LOCALE = 'en-GB';

const asDate = (date) => (typeof date === 'string' ? new Date(`${date}T00:00:00`) : date);

export const formatLongDate = (date) =>
  new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
    asDate(date)
  );

/** Short enough for an app bar under a title: "Sat 13 Sep". */
export const formatBarDate = (date) =>
  new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' }).format(asDate(date));

export const formatShortDate = (date) =>
  new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' }).format(asDate(date));

export const formatWeekday = (date) =>
  new Intl.DateTimeFormat(LOCALE, { weekday: 'short' }).format(asDate(date));

/** Just the day number, for the date strip's cells. */
export const formatDayOfMonth = (date) => String(asDate(date).getDate());

/** Round for display without printing "12.0" or "-0". */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const rounded = Number(Number(value).toFixed(decimals));
  return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

export function formatSigned(value, decimals = 1, unit = '') {
  if (value === null || value === undefined) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumber(value, decimals)}${unit}`;
}

/** Today's date as YYYY-MM-DD in the viewer's own timezone. */
export const todayISO = () => new Intl.DateTimeFormat('en-CA').format(new Date());

export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍿' }
];

export const mealTypeLabel = (value) => MEAL_TYPES.find((t) => t.value === value)?.label ?? value;
export const mealTypeIcon = (value) => MEAL_TYPES.find((t) => t.value === value)?.icon ?? '🍽️';

/** The meal most likely being logged right now, so the portion sheet opens on
 *  the right choice instead of always defaulting to lunch. */
export function mealTypeForNow(hour = new Date().getHours()) {
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 22) return 'dinner';
  return 'snack';
}

// ─── Mobile-only helpers ────────────────────────────────────────────────────

/** Shift a YYYY-MM-DD string by whole days without crossing a timezone. */
export function addDaysISO(iso, days) {
  const [year, month, day] = iso.split('-').map(Number);
  // Built in UTC so a DST boundary cannot turn "+1 day" into the same date.
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

/** The last `count` days ending today, oldest first — the date strip's range. */
export function recentDays(count, end = todayISO()) {
  return Array.from({ length: count }, (_, index) => addDaysISO(end, index - (count - 1)));
}

/** "Today" / "Yesterday" where they apply, a real date everywhere else. */
export function formatRelativeDay(iso) {
  const today = todayISO();
  if (iso === today) return 'Today';
  if (iso === addDaysISO(today, -1)) return 'Yesterday';
  return formatBarDate(iso);
}

/** Initials for the avatar, capped at two so a long name stays a circle. */
export function initialsOf(name) {
  return (
    (name ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || '?'
  );
}
