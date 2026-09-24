// Food catalog: local cache first, USDA FoodData Central second.
//
// Search strategy — local rows answer instantly and work with no API key; when
// the local catalog is thin for a term, USDA is queried and every result is
// written back, so the catalog grows into exactly the foods these users eat.
import { execute, query, queryOne } from '../../db/pool.js';
import { notFound } from '../../utils/http-error.js';
import { buildUpdate, safeLimit } from '../../utils/sql.js';
import { isUsdaConfigured, searchUsda } from './usda.client.js';

const SELECT_COLUMNS = `
  id, source, fdc_id, name, brand, category, emoji,
  serving_size, serving_unit, calories, protein_g, carbs_g, fat_g,
  fiber_g, sugar_g, sodium_mg, created_by
`;

// Below this many local hits, ask USDA as well.
const LOCAL_RESULTS_THRESHOLD = 5;

const UPDATABLE = [
  'name', 'brand', 'category', 'emoji', 'serving_size', 'serving_unit',
  'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg'
];

/**
 * Search the local catalog. Uses FULLTEXT relevance when the term is long
 * enough for the index, and falls back to a prefix LIKE for short terms so
 * two-letter searches still return something.
 */
async function searchLocal(userId, term, limit) {
  const visibility = '(created_by IS NULL OR created_by = ?)';
  const bounded = safeLimit(limit, 20, 50);

  if (term.length >= 3) {
    return query(
      `SELECT ${SELECT_COLUMNS}, MATCH(name, brand) AGAINST (? IN NATURAL LANGUAGE MODE) AS relevance
         FROM foods
        WHERE ${visibility}
          AND (MATCH(name, brand) AGAINST (? IN NATURAL LANGUAGE MODE) OR name LIKE ?)
        ORDER BY relevance DESC, source = 'custom' DESC, LENGTH(name) ASC
        LIMIT ${bounded}`,
      [term, userId, term, `${term}%`]
    );
  }

  return query(
    `SELECT ${SELECT_COLUMNS} FROM foods
      WHERE ${visibility} AND name LIKE ?
      ORDER BY source = 'custom' DESC, LENGTH(name) ASC
      LIMIT ${bounded}`,
    [userId, `${term}%`]
  );
}

/** Insert or refresh USDA rows, keyed on fdc_id so repeat searches don't duplicate. */
async function cacheUsdaFoods(foods) {
  if (!foods.length) return;
  await Promise.all(
    foods.map((food) =>
      execute(
        `INSERT INTO foods
           (source, fdc_id, name, brand, category, serving_size, serving_unit,
            calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg)
         VALUES ('usda', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), brand = VALUES(brand), category = VALUES(category),
           calories = VALUES(calories), protein_g = VALUES(protein_g),
           carbs_g = VALUES(carbs_g), fat_g = VALUES(fat_g),
           fiber_g = VALUES(fiber_g), sugar_g = VALUES(sugar_g), sodium_mg = VALUES(sodium_mg)`,
        [
          food.fdc_id, food.name, food.brand, food.category, food.serving_size, food.serving_unit,
          food.calories, food.protein_g, food.carbs_g, food.fat_g,
          food.fiber_g, food.sugar_g, food.sodium_mg
        ]
      ).catch((error) => console.warn(`Could not cache FDC ${food.fdc_id}: ${error.message}`))
    )
  );
}

export async function searchFoods(userId, term, limit = 20) {
  const trimmed = term.trim();
  if (!trimmed) return { foods: [], source: 'local' };

  let local = await searchLocal(userId, trimmed, limit);

  if (local.length < LOCAL_RESULTS_THRESHOLD && isUsdaConfigured()) {
    const remote = await searchUsda(trimmed, { pageSize: limit });
    if (remote.length) {
      await cacheUsdaFoods(remote);
      // Re-read so callers always get rows with real database ids to log against.
      local = await searchLocal(userId, trimmed, limit);
      return { foods: local, source: 'usda' };
    }
  }

  return { foods: local, source: 'local' };
}

export async function getFood(userId, id) {
  const food = await queryOne(
    `SELECT ${SELECT_COLUMNS} FROM foods WHERE id = ? AND (created_by IS NULL OR created_by = ?)`,
    [id, userId]
  );
  if (!food) throw notFound('Food not found');
  return food;
}

export async function createFood(userId, input) {
  const result = await execute(
    `INSERT INTO foods
       (source, name, brand, category, emoji, serving_size, serving_unit,
        calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, created_by)
     VALUES ('custom', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name, input.brand ?? null, input.category ?? null, input.emoji ?? null,
      input.serving_size, input.serving_unit,
      input.calories, input.protein_g, input.carbs_g, input.fat_g,
      input.fiber_g ?? null, input.sugar_g ?? null, input.sodium_mg ?? null,
      userId
    ]
  );
  return getFood(userId, result.insertId);
}

export async function updateFood(userId, id, patch) {
  const { clause, params, isEmpty } = buildUpdate(patch, UPDATABLE);
  if (isEmpty) return getFood(userId, id);

  // created_by = ? (not NULL-able) so shared USDA rows can never be edited.
  const result = await execute(`UPDATE foods SET ${clause} WHERE id = ? AND created_by = ?`, [
    ...params,
    id,
    userId
  ]);
  if (!result.affectedRows) throw notFound('Custom food not found');
  return getFood(userId, id);
}

export async function deleteFood(userId, id) {
  const result = await execute('DELETE FROM foods WHERE id = ? AND created_by = ?', [id, userId]);
  if (!result.affectedRows) throw notFound('Custom food not found');
}

/** Catalog size and provenance — surfaced in settings so the data source is visible. */
export async function catalogStats() {
  const rows = await query('SELECT source, COUNT(*) AS count FROM foods GROUP BY source');
  const bySource = Object.fromEntries(rows.map((r) => [r.source, Number(r.count)]));
  return {
    total: Object.values(bySource).reduce((sum, n) => sum + n, 0),
    usda: bySource.usda ?? 0,
    seed: bySource.seed ?? 0,
    custom: bySource.custom ?? 0,
    usda_api_enabled: isUsdaConfigured()
  };
}
