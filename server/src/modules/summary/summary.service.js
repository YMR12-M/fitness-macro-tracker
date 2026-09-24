// Aggregates. Every number the dashboard and progress charts display is
// computed here from logged rows — there are no fixture arrays anywhere.
import { query, queryOne } from '../../db/pool.js';
import { addDays, dateRange, daysAgo, todayISO } from '../../utils/dates.js';

/** The targets this user is being measured against, straight from their profile. */
function targetsFor(user) {
  return {
    calories: Number(user.calorie_goal ?? 2000),
    protein_g: Number(user.protein_goal_g ?? 150),
    carbs_g: Number(user.carbs_goal_g ?? 220),
    fat_g: Number(user.fat_goal_g ?? 65),
    water_ml: Number(user.water_goal_ml ?? 2500)
  };
}

const pct = (value, target) => (target > 0 ? Math.round((value / target) * 100) : 0);

// SUM() over DECIMAL columns comes back as a float, so totals like 641.2 - 430
// pick up binary-fraction noise. Every number leaving this module is rounded to
// one decimal place before it reaches the client.
const round1 = (value) => Math.round(Number(value) * 10) / 10;

export async function dailySummary(user, date) {
  const day = date ?? todayISO(user.timezone);
  const targets = targetsFor(user);

  const [nutrition, training, water] = await Promise.all([
    queryOne(
      `SELECT COALESCE(SUM(calories), 0)  AS calories,
              COALESCE(SUM(protein_g), 0) AS protein_g,
              COALESCE(SUM(carbs_g), 0)   AS carbs_g,
              COALESCE(SUM(fat_g), 0)     AS fat_g,
              COUNT(*)                    AS entries
         FROM meal_entries WHERE user_id = ? AND logged_on = ?`,
      [user.id, day]
    ),
    queryOne(
      `SELECT COALESCE(SUM(calories_burned), 0)  AS calories_burned,
              COALESCE(SUM(duration_minutes), 0) AS minutes,
              COUNT(*)                           AS sessions
         FROM workouts WHERE user_id = ? AND performed_on = ?`,
      [user.id, day]
    ),
    queryOne(
      'SELECT COALESCE(SUM(amount_ml), 0) AS amount_ml FROM water_entries WHERE user_id = ? AND logged_on = ?',
      [user.id, day]
    )
  ]);

  const eaten = round1(nutrition.calories);
  const burned = round1(training.calories_burned);

  // Per-meal breakdown, so the dashboard can show where the day's calories went.
  const byMealType = await query(
    `SELECT meal_type,
            COALESCE(SUM(calories), 0)  AS calories,
            COALESCE(SUM(protein_g), 0) AS protein_g,
            COALESCE(SUM(carbs_g), 0)   AS carbs_g,
            COALESCE(SUM(fat_g), 0)     AS fat_g,
            COUNT(*)                    AS entries
       FROM meal_entries
      WHERE user_id = ? AND logged_on = ?
      GROUP BY meal_type`,
    [user.id, day]
  );

  return {
    date: day,
    targets,
    calories: {
      eaten,
      burned,
      net: round1(eaten - burned),
      goal: targets.calories,
      remaining: Math.round(targets.calories - eaten + burned),
      percent: pct(eaten, targets.calories)
    },
    macros: {
      protein_g: round1(nutrition.protein_g),
      carbs_g: round1(nutrition.carbs_g),
      fat_g: round1(nutrition.fat_g),
      protein_percent: pct(Number(nutrition.protein_g), targets.protein_g),
      carbs_percent: pct(Number(nutrition.carbs_g), targets.carbs_g),
      fat_percent: pct(Number(nutrition.fat_g), targets.fat_g)
    },
    water: {
      amount_ml: Number(water.amount_ml),
      goal_ml: targets.water_ml,
      percent: pct(Number(water.amount_ml), targets.water_ml)
    },
    workout: {
      minutes: Number(training.minutes),
      sessions: Number(training.sessions),
      calories_burned: burned
    },
    meal_entries: Number(nutrition.entries),
    by_meal_type: byMealType.map((row) => ({
      ...row,
      calories: round1(row.calories),
      protein_g: round1(row.protein_g),
      carbs_g: round1(row.carbs_g),
      fat_g: round1(row.fat_g)
    }))
  };
}

/**
 * One row per day across a window, with days that have no logs filled in as
 * zeroes — a gap in a chart should read as "ate nothing recorded", not as a
 * missing point that silently shortens the axis.
 */
export async function dailySeries(user, days = 7) {
  const end = todayISO(user.timezone);
  const start = daysAgo(days, user.timezone);
  const targets = targetsFor(user);

  const [meals, workouts, water] = await Promise.all([
    query(
      `SELECT logged_on AS date,
              COALESCE(SUM(calories), 0)  AS calories,
              COALESCE(SUM(protein_g), 0) AS protein_g,
              COALESCE(SUM(carbs_g), 0)   AS carbs_g,
              COALESCE(SUM(fat_g), 0)     AS fat_g
         FROM meal_entries
        WHERE user_id = ? AND logged_on BETWEEN ? AND ?
        GROUP BY logged_on`,
      [user.id, start, end]
    ),
    query(
      `SELECT performed_on AS date,
              COALESCE(SUM(calories_burned), 0)  AS calories_burned,
              COALESCE(SUM(duration_minutes), 0) AS minutes
         FROM workouts
        WHERE user_id = ? AND performed_on BETWEEN ? AND ?
        GROUP BY performed_on`,
      [user.id, start, end]
    ),
    query(
      `SELECT logged_on AS date, COALESCE(SUM(amount_ml), 0) AS amount_ml
         FROM water_entries
        WHERE user_id = ? AND logged_on BETWEEN ? AND ?
        GROUP BY logged_on`,
      [user.id, start, end]
    )
  ]);

  const index = (rows) => new Map(rows.map((r) => [String(r.date).slice(0, 10), r]));
  const mealsBy = index(meals);
  const workoutsBy = index(workouts);
  const waterBy = index(water);

  return {
    from: start,
    to: end,
    targets,
    days: dateRange(start, end).map((date) => {
      const m = mealsBy.get(date);
      const w = workoutsBy.get(date);
      return {
        date,
        calories_eaten: round1(m?.calories ?? 0),
        calories_burned: round1(w?.calories_burned ?? 0),
        calorie_goal: targets.calories,
        protein_g: round1(m?.protein_g ?? 0),
        carbs_g: round1(m?.carbs_g ?? 0),
        fat_g: round1(m?.fat_g ?? 0),
        workout_minutes: Number(w?.minutes ?? 0),
        water_ml: Number(waterBy.get(date)?.amount_ml ?? 0)
      };
    })
  };
}

/**
 * Consecutive days, ending today or yesterday, on which the user logged at
 * least one meal. Today not yet logged does not break a streak that is still
 * live — it just has not been extended yet.
 */
export async function loggingStreak(user) {
  const today = todayISO(user.timezone);
  const rows = await query(
    `SELECT DISTINCT logged_on AS date
       FROM meal_entries
      WHERE user_id = ? AND logged_on <= ?
      ORDER BY logged_on DESC
      LIMIT 400`,
    [user.id, today]
  );
  if (!rows.length) return { current: 0, longest: 0, logged_today: false };

  const logged = new Set(rows.map((r) => String(r.date).slice(0, 10)));
  const loggedToday = logged.has(today);

  let current = 0;
  let cursor = loggedToday ? today : addDays(today, -1);
  while (logged.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  // Longest run anywhere in the history we pulled.
  const ascending = [...logged].sort();
  let longest = 0;
  let run = 0;
  let previous = null;
  for (const date of ascending) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }

  return { current, longest, logged_today: loggedToday };
}

/** Averages over a window — the honest read on whether targets are being hit. */
export async function adherence(user, days = 7) {
  const series = await dailySeries(user, days);
  const withLogs = series.days.filter((d) => d.calories_eaten > 0);
  if (!withLogs.length) {
    return { window_days: days, days_logged: 0, avg_calories: 0, avg_protein_g: 0, avg_carbs_g: 0, avg_fat_g: 0, on_target_days: 0 };
  }

  const mean = (key) => Math.round(withLogs.reduce((sum, d) => sum + d[key], 0) / withLogs.length);
  // "On target" = within 10% of the calorie goal, the usual tracking tolerance.
  const onTarget = withLogs.filter(
    (d) => Math.abs(d.calories_eaten - series.targets.calories) <= series.targets.calories * 0.1
  ).length;

  return {
    window_days: days,
    days_logged: withLogs.length,
    avg_calories: mean('calories_eaten'),
    avg_protein_g: mean('protein_g'),
    avg_carbs_g: mean('carbs_g'),
    avg_fat_g: mean('fat_g'),
    on_target_days: onTarget
  };
}
