/** Display formatting. Locale-aware, and tolerant of the nulls the API returns. */

const LOCALE = 'en-GB';

export const formatLongDate = (date) =>
  new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
    typeof date === 'string' ? new Date(`${date}T00:00:00`) : date
  );

export const formatShortDate = (date) =>
  new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' }).format(
    typeof date === 'string' ? new Date(`${date}T00:00:00`) : date
  );

/** The masthead's two lines: "Sunday" over "4 Oct 2026". */
export function formatMastheadDate(date) {
  return {
    weekday: new Intl.DateTimeFormat(LOCALE, { weekday: 'long' }).format(date),
    date: new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
  };
}

/** "Morning, Karim." — the dashboard's opening line. */
export function greeting(name, now = new Date()) {
  const hour = now.getHours();
  const part = hour < 5 ? 'Late night' : hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
  return name ? `${part}, ${name}.` : `${part}.`;
}

export const formatWeekday = (date) =>
  new Intl.DateTimeFormat(LOCALE, { weekday: 'short' }).format(
    typeof date === 'string' ? new Date(`${date}T00:00:00`) : date
  );

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
  { value: 'breakfast', label: 'Breakfast', icon: 'sunrise' },
  { value: 'lunch', label: 'Lunch', icon: 'sun' },
  { value: 'dinner', label: 'Dinner', icon: 'moon' },
  { value: 'snack', label: 'Snack', icon: 'snack' }
];

export const mealTypeLabel = (value) => MEAL_TYPES.find((t) => t.value === value)?.label ?? value;
export const mealTypeIcon = (value) => MEAL_TYPES.find((t) => t.value === value)?.icon ?? 'plate';
