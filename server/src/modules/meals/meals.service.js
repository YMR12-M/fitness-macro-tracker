// Meal logging. Every query filters on user_id — a row is only ever reachable
// by the account that created it.
import { execute, query, queryOne } from '../../db/pool.js';
import { notFound, unprocessable } from '../../utils/http-error.js';
import { todayISO } from '../../utils/dates.js';
import { buildUpdate, safeLimit } from '../../utils/sql.js';

// Columns a PATCH is allowed to touch. Column names come from here, never from
// the request body.
const UPDATABLE = [
  'name', 'emoji', 'meal_type', 'quantity', 'unit',
  'calories', 'protein_g', 'carbs_g', 'fat_g', 'logged_on'
];

const SELECT_COLUMNS = `
  id, food_id, name, emoji, meal_type, quantity, unit,
  calories, protein_g, carbs_g, fat_g, logged_on, logged_at
`;

export async function listMeals(userId, { date, from, to, meal_type: mealType } = {}, timezone = 'UTC') {
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (from && to) {
    conditions.push('logged_on BETWEEN ? AND ?');
    params.push(from, to);
  } else {
    conditions.push('logged_on = ?');
    params.push(date ?? todayISO(timezone));
  }

  if (mealType) {
    conditions.push('meal_type = ?');
    params.push(mealType);
  }

  return query(
    `SELECT ${SELECT_COLUMNS} FROM meal_entries
      WHERE ${conditions.join(' AND ')}
      ORDER BY logged_at DESC, id DESC`,
    params
  );
}

export async function getMeal(userId, id) {
  const meal = await queryOne(`SELECT ${SELECT_COLUMNS} FROM meal_entries WHERE id = ? AND user_id = ?`, [
    id,
    userId
  ]);
  if (!meal) throw notFound('Meal not found');
  return meal;
}

/**
 * Scale a catalog food's per-serving nutrients to the quantity actually eaten.
 * USDA rows are per 100 g/ml, so serving_size carries the divisor.
 */
function scaleFood(food, quantity) {
  const factor = quantity / Number(food.serving_size || 100);
  const round = (n) => Math.round(Number(n || 0) * factor * 100) / 100;
  return {
    name: food.name,
    emoji: food.emoji,
    calories: round(food.calories),
    protein_g: round(food.protein_g),
    carbs_g: round(food.carbs_g),
    fat_g: round(food.fat_g)
  };
}

export async function createMeal(userId, input, timezone = 'UTC') {
  let values = {
    food_id: input.food_id ?? null,
    name: input.name,
    emoji: input.emoji ?? null,
    calories: input.calories,
    protein_g: input.protein_g,
    carbs_g: input.carbs_g,
    fat_g: input.fat_g
  };

  if (input.food_id) {
    const food = await queryOne(
      `SELECT id, name, emoji, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g
         FROM foods
        WHERE id = ? AND (created_by IS NULL OR created_by = ?)`,
      [input.food_id, userId]
    );
    if (!food) throw unprocessable('That food is not in the catalog');

    const scaled = scaleFood(food, input.quantity);
    values = {
      food_id: food.id,
      // An explicit name/emoji on the request still wins, for "Mum's rice" over "Rice, white, cooked".
      name: input.name ?? scaled.name,
      emoji: input.emoji ?? scaled.emoji,
      calories: input.calories ?? scaled.calories,
      protein_g: input.calories !== undefined ? input.protein_g : scaled.protein_g,
      carbs_g: input.calories !== undefined ? input.carbs_g : scaled.carbs_g,
      fat_g: input.calories !== undefined ? input.fat_g : scaled.fat_g
    };
  }

  const result = await execute(
    `INSERT INTO meal_entries
       (user_id, food_id, name, emoji, meal_type, quantity, unit, calories, protein_g, carbs_g, fat_g, logged_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      values.food_id,
      values.name,
      values.emoji,
      input.meal_type,
      input.quantity,
      input.unit,
      values.calories,
      values.protein_g,
      values.carbs_g,
      values.fat_g,
      input.logged_on ?? todayISO(timezone)
    ]
  );

  return getMeal(userId, result.insertId);
}

export async function updateMeal(userId, id, patch) {
  const { clause, params, isEmpty } = buildUpdate(patch, UPDATABLE);
  if (isEmpty) return getMeal(userId, id);

  const result = await execute(`UPDATE meal_entries SET ${clause} WHERE id = ? AND user_id = ?`, [
    ...params,
    id,
    userId
  ]);
  if (!result.affectedRows) throw notFound('Meal not found');

  return getMeal(userId, id);
}

export async function deleteMeal(userId, id) {
  const result = await execute('DELETE FROM meal_entries WHERE id = ? AND user_id = ?', [id, userId]);
  if (!result.affectedRows) throw notFound('Meal not found');
}

/** Distinct foods the user logs most often — powers the "quick add" list. */
export async function frequentMeals(userId, limit = 8) {
  return query(
    `SELECT name, emoji, meal_type, food_id, unit,
            ROUND(AVG(quantity), 0)  AS quantity,
            ROUND(AVG(calories), 0)  AS calories,
            ROUND(AVG(protein_g), 1) AS protein_g,
            ROUND(AVG(carbs_g), 1)   AS carbs_g,
            ROUND(AVG(fat_g), 1)     AS fat_g,
            COUNT(*)                 AS times_logged,
            MAX(logged_at)           AS last_logged_at
       FROM meal_entries
      WHERE user_id = ?
      GROUP BY name, emoji, meal_type, food_id, unit
      ORDER BY times_logged DESC, last_logged_at DESC
      LIMIT ${safeLimit(limit, 8, 50)}`,
    [userId]
  );
}
