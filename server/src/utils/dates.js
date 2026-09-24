/** Date helpers. Everything the API stores as a DATE is a plain YYYY-MM-DD string. */

export function todayISO(timezone = 'UTC') {
  // en-CA formats as YYYY-MM-DD, which is what MySQL DATE columns expect.
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Inclusive list of ISO dates from `start` to `end`. */
export function dateRange(start, end) {
  const dates = [];
  for (let d = start; d <= end; d = addDays(d, 1)) dates.push(d);
  return dates;
}

/** The ISO date `days` before today, inclusive of today when days = 1. */
export function daysAgo(days, timezone = 'UTC') {
  return addDays(todayISO(timezone), -(days - 1));
}

export function ageFromBirthDate(birthDate, onDate = todayISO()) {
  if (!birthDate) return null;
  const birth = new Date(`${String(birthDate).slice(0, 10)}T00:00:00Z`);
  const on = new Date(`${onDate}T00:00:00Z`);
  let age = on.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = on.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && on.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 ? age : null;
}
