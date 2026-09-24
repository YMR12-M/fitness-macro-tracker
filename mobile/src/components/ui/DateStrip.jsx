import { useEffect, useRef } from 'react';
import { Icon } from './Icon.jsx';
import { addDaysISO, formatDayOfMonth, formatWeekday, recentDays, todayISO } from '../../lib/format.js';
import { haptic } from '../../lib/haptics.js';
import { scrollChildIntoViewX } from '../../lib/scroll.js';

/**
 * A horizontal run of recent days, most recent last.
 *
 * A `<input type="date">` is the wrong control for "what did I eat yesterday" —
 * it costs a tap to open, a scroll through a calendar, and a tap to confirm,
 * for a date that is almost always within the last week. This is one tap for
 * that case, and the calendar button beside it still opens the native picker
 * for anything older.
 *
 * `loggedDates` marks the days that already have entries, so the strip doubles
 * as a glance at how the week has gone.
 */
export function DateStrip({ value, onChange, days = 14, loggedDates }) {
  const stripRef = useRef(null);
  const dates = recentDays(days);
  const today = todayISO();

  // The selected day should be in view when the screen opens, which for the
  // default (today) means scrolled fully to the right-hand end. Horizontal
  // only — scrollIntoView would take the whole page down with it.
  useEffect(() => {
    const strip = stripRef.current;
    scrollChildIntoViewX(strip, strip?.querySelector('[aria-pressed="true"]'));
  }, [value]);

  return (
    <div className="row" style={{ gap: 8 }}>
      <div className="datestrip" ref={stripRef} role="group" aria-label="Choose a day">
        {dates.map((iso) => (
          <button
            key={iso}
            type="button"
            className="datestrip-day"
            aria-pressed={value === iso}
            aria-label={iso === today ? `Today, ${iso}` : iso}
            onClick={() => {
              haptic('tap');
              onChange(iso);
            }}
          >
            <span className="datestrip-weekday">{iso === today ? 'Today' : formatWeekday(iso)}</span>
            <span className="datestrip-date">{formatDayOfMonth(iso)}</span>
            <span
              className={`datestrip-dot${loggedDates?.has(iso) ? ' is-logged' : ''}`}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>

      {/* The native picker, for anything older than the strip reaches. The
          input is visually hidden behind the button rather than removed, so
          the control stays keyboard-reachable and properly labelled. */}
      <label className="btn-icon" style={{ position: 'relative' }}>
        <Icon name="calendar" size={20} />
        <span className="visually-hidden">Pick another date</span>
        <input
          type="date"
          value={value}
          max={today}
          // A year back matches the longest window the progress screen offers.
          min={addDaysISO(today, -365)}
          onChange={(event) => event.target.value && onChange(event.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%' }}
        />
      </label>
    </div>
  );
}
