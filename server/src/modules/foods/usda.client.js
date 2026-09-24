// Client for USDA FoodData Central (https://fdc.nal.usda.gov/api-guide.html).
//
// FDC returns nutrients as a flat list keyed by numeric nutrient id, per 100 g
// or 100 ml for the data types we request. This module turns that into the
// shape of our `foods` table and nothing else — caching and persistence are
// the service's job.
import { env } from '../../config/env.js';

// Nutrient ids are stable across the dataset; names are not.
const NUTRIENT = {
  ENERGY_KCAL: 1008,
  ENERGY_ATWATER: 2047, // some Foundation foods report energy only under this id
  PROTEIN: 1003,
  FAT: 1004,
  CARBS: 1005,
  FIBER: 1079,
  SUGAR: 2000,
  SODIUM: 1093
};

// Foundation and SR Legacy are lab-analysed whole foods; FNDDS covers prepared
// dishes; Branded covers packaged products. Ordered by data quality.
const DATA_TYPES = ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded'];

const REQUEST_TIMEOUT_MS = 8000;

export const isUsdaConfigured = () => Boolean(env.USDA_API_KEY);

function nutrientValue(food, ...ids) {
  for (const id of ids) {
    const match = food.foodNutrients?.find((n) => (n.nutrientId ?? n.nutrient?.id) === id);
    const value = match?.value ?? match?.amount;
    if (value != null && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

/** Title-case USDA's shouty descriptions ("CHICKEN BREAST, RAW" -> "Chicken breast, raw"). */
function tidyName(description = '') {
  const trimmed = description.trim();
  if (trimmed !== trimmed.toUpperCase()) return trimmed;
  return trimmed.charAt(0) + trimmed.slice(1).toLowerCase();
}

/** Map an FDC food object onto our `foods` column shape. Returns null if unusable. */
export function normaliseFood(food) {
  const calories = nutrientValue(food, NUTRIENT.ENERGY_KCAL, NUTRIENT.ENERGY_ATWATER);
  if (calories == null) return null; // a food with no energy value cannot be logged

  const isLiquid = /(beverage|juice|milk|drink|water|soda)/i.test(
    `${food.description ?? ''} ${food.foodCategory ?? ''}`
  );

  return {
    fdc_id: food.fdcId,
    source: 'usda',
    name: tidyName(food.description),
    brand: food.brandOwner || food.brandName || null,
    category: typeof food.foodCategory === 'string' ? food.foodCategory : (food.foodCategory?.description ?? null),
    // FDC search results are normalised to 100 g/ml for these data types.
    serving_size: 100,
    serving_unit: isLiquid ? 'ml' : 'g',
    calories: Math.round(calories * 100) / 100,
    protein_g: nutrientValue(food, NUTRIENT.PROTEIN) ?? 0,
    carbs_g: nutrientValue(food, NUTRIENT.CARBS) ?? 0,
    fat_g: nutrientValue(food, NUTRIENT.FAT) ?? 0,
    fiber_g: nutrientValue(food, NUTRIENT.FIBER),
    sugar_g: nutrientValue(food, NUTRIENT.SUGAR),
    sodium_mg: nutrientValue(food, NUTRIENT.SODIUM)
  };
}

async function fdcFetch(path, params) {
  const url = new URL(`${env.USDA_API_BASE}${path}`);
  url.searchParams.set('api_key', env.USDA_API_KEY);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(`USDA FoodData Central responded ${response.status}`);
  }
  return response.json();
}

/**
 * Search FDC. Returns [] rather than throwing when the upstream is unavailable:
 * a nutrition API being down must not break meal logging, because the locally
 * cached catalog can still answer.
 */
export async function searchUsda(term, { pageSize = 20 } = {}) {
  if (!isUsdaConfigured()) return [];
  try {
    const data = await fdcFetch('/foods/search', {
      query: term,
      pageSize,
      dataType: DATA_TYPES.join(','),
      sortBy: 'dataType.keyword',
      sortOrder: 'asc'
    });
    return (data.foods ?? []).map(normaliseFood).filter(Boolean);
  } catch (error) {
    console.warn(`USDA search failed for "${term}": ${error.message}`);
    return [];
  }
}

