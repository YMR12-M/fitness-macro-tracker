#!/usr/bin/env node
// Seeds *reference* data only: training programs and a starter food catalog.
//
// It deliberately creates no users, meals, weights or goals. Every row tied to
// a person gets there because that person logged it — which is the whole point
// of the app. Re-running is safe: inserts are keyed on natural identifiers and
// update in place.
//
//   npm run db:seed              programs + reference foods
//   npm run db:seed -- --usda    also warm the cache from the live USDA API
import { closePool, execute, query, withTransaction } from './pool.js';
import { PROGRAMS } from './seeds/programs.js';
import { REFERENCE_FOODS } from './seeds/reference-foods.js';
import { isUsdaConfigured, searchUsda } from '../modules/foods/usda.client.js';

// Common search terms used to pre-populate the cache from the live API.
const USDA_WARM_TERMS = [
  'chicken breast', 'white rice', 'egg', 'oats', 'banana', 'whole milk',
  'greek yogurt', 'salmon', 'lentils', 'ground beef', 'almonds', 'olive oil',
  'sweet potato', 'broccoli', 'whey protein', 'peanut butter', 'tuna', 'pasta'
];

async function seedPrograms() {
  let programCount = 0;
  let exerciseCount = 0;

  for (const program of PROGRAMS) {
    await withTransaction(async (conn) => {
      await conn.execute(
        `INSERT INTO programs (slug, name, emoji, description, days_per_week, level, accent)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), emoji = VALUES(emoji), description = VALUES(description),
           days_per_week = VALUES(days_per_week), level = VALUES(level), accent = VALUES(accent)`,
        [
          program.slug, program.name, program.emoji, program.description,
          program.days_per_week, program.level, program.accent
        ]
      );

      const [[{ id }]] = await conn.query('SELECT id FROM programs WHERE slug = ?', [program.slug]);

      // Replace the template wholesale so edits to this file are authoritative.
      await conn.execute('DELETE FROM program_exercises WHERE program_id = ?', [id]);

      for (const [dayIndex, day] of program.days.entries()) {
        for (const [position, exercise] of day.exercises.entries()) {
          await conn.execute(
            `INSERT INTO program_exercises
               (program_id, day_index, day_label, name, muscle, target_sets, target_reps, position)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, dayIndex, day.label, exercise.name, exercise.muscle ?? null, exercise.sets, exercise.reps, position]
          );
          exerciseCount += 1;
        }
      }
      programCount += 1;
    });
  }

  console.log(`  programs:        ${programCount} (${exerciseCount} prescribed exercises)`);
}

async function seedReferenceFoods() {
  let inserted = 0;

  for (const food of REFERENCE_FOODS) {
    // No natural key on seed rows, so match on (source, name) to stay idempotent.
    const [existing] = await query('SELECT id FROM foods WHERE source = ? AND name = ? LIMIT 1', ['seed', food.name]);

    const values = [
      food.name, food.category ?? null, food.emoji ?? null,
      food.unit ?? 'g',
      food.calories, food.protein_g, food.carbs_g, food.fat_g,
      food.fiber_g ?? null, food.sugar_g ?? null, food.sodium_mg ?? null
    ];

    if (existing) {
      await execute(
        `UPDATE foods
            SET name = ?, category = ?, emoji = ?, serving_unit = ?,
                calories = ?, protein_g = ?, carbs_g = ?, fat_g = ?,
                fiber_g = ?, sugar_g = ?, sodium_mg = ?
          WHERE id = ?`,
        [...values, existing.id]
      );
    } else {
      await execute(
        `INSERT INTO foods
           (source, name, category, emoji, serving_size, serving_unit,
            calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg)
         VALUES ('seed', ?, ?, ?, 100, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values
      );
      inserted += 1;
    }
  }

  console.log(`  reference foods: ${REFERENCE_FOODS.length} (${inserted} new, ${REFERENCE_FOODS.length - inserted} refreshed)`);
}

async function warmUsdaCache() {
  if (!isUsdaConfigured()) {
    console.log('  USDA cache:      skipped (no USDA_API_KEY set)');
    return;
  }

  let cached = 0;
  for (const term of USDA_WARM_TERMS) {
    const foods = await searchUsda(term, { pageSize: 10 });
    for (const food of foods) {
      await execute(
        `INSERT INTO foods
           (source, fdc_id, name, brand, category, serving_size, serving_unit,
            calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg)
         VALUES ('usda', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), calories = VALUES(calories), protein_g = VALUES(protein_g),
           carbs_g = VALUES(carbs_g), fat_g = VALUES(fat_g)`,
        [
          food.fdc_id, food.name, food.brand, food.category, food.serving_size, food.serving_unit,
          food.calories, food.protein_g, food.carbs_g, food.fat_g,
          food.fiber_g, food.sugar_g, food.sodium_mg
        ]
      ).catch(() => {});
      cached += 1;
    }
  }
  console.log(`  USDA cache:      ${cached} foods pulled from FoodData Central`);
}

async function main() {
  console.log('Seeding reference data (no user records are created):');
  try {
    await seedPrograms();
    await seedReferenceFoods();
    if (process.argv.includes('--usda')) await warmUsdaCache();

    const [{ foods }] = await query('SELECT COUNT(*) AS foods FROM foods');
    console.log(`\nDone. Food catalog now holds ${foods} entries.`);
  } catch (error) {
    console.error(`\nSeed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

main();
