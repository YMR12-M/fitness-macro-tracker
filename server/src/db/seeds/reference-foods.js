// Starter food catalog: reference values per 100 g / 100 ml, derived from USDA
// FoodData Central (SR Legacy and Foundation Foods).
//
// This exists so search works the moment the database is migrated, before a
// USDA API key is configured. Rows are inserted with source = 'seed' so their
// provenance stays distinguishable from rows fetched live from the API.
//
// Every entry is the *cooked or as-eaten* state where that is how people log
// it — the distinction matters, because raw and cooked values differ by more
// than most tracking mistakes do.

export const REFERENCE_FOODS = [
  // ── Protein: meat, fish, eggs ─────────────────────────────────────────────
  { name: 'Chicken breast, roasted, skinless', emoji: '🍗', category: 'Poultry',   calories: 165, protein_g: 31.0, carbs_g: 0,    fat_g: 3.6,  sodium_mg: 74 },
  { name: 'Chicken thigh, roasted, skinless',  emoji: '🍗', category: 'Poultry',   calories: 209, protein_g: 26.0, carbs_g: 0,    fat_g: 10.9, sodium_mg: 88 },
  { name: 'Turkey breast, roasted',            emoji: '🦃', category: 'Poultry',   calories: 135, protein_g: 30.1, carbs_g: 0,    fat_g: 0.7,  sodium_mg: 1015 },
  { name: 'Ground beef, 85% lean, cooked',     emoji: '🥩', category: 'Beef',      calories: 250, protein_g: 26.0, carbs_g: 0,    fat_g: 15.4, sodium_mg: 75 },
  { name: 'Beef sirloin steak, grilled',       emoji: '🥩', category: 'Beef',      calories: 201, protein_g: 29.8, carbs_g: 0,    fat_g: 8.0,  sodium_mg: 55 },
  { name: 'Lamb, lean, roasted',               emoji: '🍖', category: 'Lamb',      calories: 258, protein_g: 25.6, carbs_g: 0,    fat_g: 16.5, sodium_mg: 72 },
  { name: 'Salmon, Atlantic, farmed, cooked',  emoji: '🐟', category: 'Fish',      calories: 206, protein_g: 22.1, carbs_g: 0,    fat_g: 12.4, sodium_mg: 61 },
  { name: 'Tilapia, cooked',                   emoji: '🐟', category: 'Fish',      calories: 128, protein_g: 26.2, carbs_g: 0,    fat_g: 2.7,  sodium_mg: 56 },
  { name: 'Tuna, canned in water, drained',    emoji: '🐠', category: 'Fish',      calories: 116, protein_g: 25.5, carbs_g: 0,    fat_g: 0.8,  sodium_mg: 247 },
  { name: 'Shrimp, cooked',                    emoji: '🦐', category: 'Seafood',   calories: 99,  protein_g: 24.0, carbs_g: 0.2,  fat_g: 0.3,  sodium_mg: 111 },
  { name: 'Egg, whole, hard-boiled',           emoji: '🥚', category: 'Eggs',      calories: 155, protein_g: 12.6, carbs_g: 1.1,  fat_g: 10.6, sodium_mg: 124 },
  { name: 'Egg white, raw',                    emoji: '🥚', category: 'Eggs',      calories: 52,  protein_g: 10.9, carbs_g: 0.7,  fat_g: 0.2,  sodium_mg: 166 },

  // ── Dairy ─────────────────────────────────────────────────────────────────
  { name: 'Milk, whole, 3.25%',                emoji: '🥛', category: 'Dairy', unit: 'ml', calories: 61,  protein_g: 3.15, carbs_g: 4.8,  fat_g: 3.25, sugar_g: 5.05, sodium_mg: 43 },
  { name: 'Milk, skimmed',                     emoji: '🥛', category: 'Dairy', unit: 'ml', calories: 34,  protein_g: 3.37, carbs_g: 4.96, fat_g: 0.08, sugar_g: 5.09, sodium_mg: 42 },
  { name: 'Greek yogurt, plain, nonfat',       emoji: '🥣', category: 'Dairy',  calories: 59,  protein_g: 10.2, carbs_g: 3.6,  fat_g: 0.39, sugar_g: 3.24, sodium_mg: 36 },
  { name: 'Yogurt, plain, whole milk',         emoji: '🥣', category: 'Dairy',  calories: 61,  protein_g: 3.47, carbs_g: 4.66, fat_g: 3.25, sugar_g: 4.66, sodium_mg: 46 },
  { name: 'Cottage cheese, 2% fat',            emoji: '🧀', category: 'Dairy',  calories: 84,  protein_g: 11.1, carbs_g: 4.3,  fat_g: 2.3,  sodium_mg: 321 },
  { name: 'Cheddar cheese',                    emoji: '🧀', category: 'Dairy',  calories: 403, protein_g: 24.9, carbs_g: 1.28, fat_g: 33.1, sodium_mg: 621 },
  { name: 'Mozzarella, part skim',             emoji: '🧀', category: 'Dairy',  calories: 254, protein_g: 24.3, carbs_g: 2.8,  fat_g: 15.9, sodium_mg: 619 },
  { name: 'Butter, salted',                    emoji: '🧈', category: 'Dairy',  calories: 717, protein_g: 0.85, carbs_g: 0.06, fat_g: 81.1, sodium_mg: 643 },

  // ── Grains and starches ───────────────────────────────────────────────────
  { name: 'White rice, long-grain, cooked',    emoji: '🍚', category: 'Grains', calories: 130, protein_g: 2.69, carbs_g: 28.2, fat_g: 0.28, fiber_g: 0.4 },
  { name: 'Brown rice, cooked',                emoji: '🍚', category: 'Grains', calories: 123, protein_g: 2.74, carbs_g: 25.6, fat_g: 0.97, fiber_g: 1.6 },
  { name: 'Pasta, enriched, cooked',           emoji: '🍝', category: 'Grains', calories: 158, protein_g: 5.8,  carbs_g: 30.9, fat_g: 0.93, fiber_g: 1.8 },
  { name: 'Oats, rolled, dry',                 emoji: '🥣', category: 'Grains', calories: 389, protein_g: 16.9, carbs_g: 66.3, fat_g: 6.9,  fiber_g: 10.6 },
  { name: 'Quinoa, cooked',                    emoji: '🌾', category: 'Grains', calories: 120, protein_g: 4.4,  carbs_g: 21.3, fat_g: 1.92, fiber_g: 2.8 },
  { name: 'Bread, white, commercial',          emoji: '🍞', category: 'Grains', calories: 266, protein_g: 9.0,  carbs_g: 49.0, fat_g: 3.3,  fiber_g: 2.7, sodium_mg: 490 },
  { name: 'Bread, whole wheat',                emoji: '🍞', category: 'Grains', calories: 247, protein_g: 13.0, carbs_g: 41.0, fat_g: 3.5,  fiber_g: 7.0, sodium_mg: 450 },
  { name: 'Pita bread, white',                 emoji: '🫓', category: 'Grains', calories: 275, protein_g: 9.1,  carbs_g: 55.7, fat_g: 1.2,  fiber_g: 2.2, sodium_mg: 536 },
  { name: 'Potato, baked, with skin',          emoji: '🥔', category: 'Vegetables', calories: 93, protein_g: 2.5, carbs_g: 21.1, fat_g: 0.13, fiber_g: 2.2 },
  { name: 'Sweet potato, baked',               emoji: '🍠', category: 'Vegetables', calories: 90, protein_g: 2.0, carbs_g: 20.7, fat_g: 0.15, fiber_g: 3.3, sugar_g: 6.5 },

  // ── Legumes ───────────────────────────────────────────────────────────────
  { name: 'Lentils, cooked',                   emoji: '🫘', category: 'Legumes', calories: 116, protein_g: 9.02, carbs_g: 20.1, fat_g: 0.38, fiber_g: 7.9 },
  { name: 'Chickpeas, cooked',                 emoji: '🫘', category: 'Legumes', calories: 164, protein_g: 8.86, carbs_g: 27.4, fat_g: 2.59, fiber_g: 7.6 },
  { name: 'Black beans, cooked',               emoji: '🫘', category: 'Legumes', calories: 132, protein_g: 8.86, carbs_g: 23.7, fat_g: 0.54, fiber_g: 8.7 },
  { name: 'Fava beans (ful medames), cooked',  emoji: '🫘', category: 'Legumes', calories: 110, protein_g: 7.6,  carbs_g: 19.6, fat_g: 0.4,  fiber_g: 5.4 },
  { name: 'Hummus, commercial',                emoji: '🫙', category: 'Legumes', calories: 166, protein_g: 7.9,  carbs_g: 14.3, fat_g: 9.6,  fiber_g: 6.0, sodium_mg: 379 },
  { name: 'Falafel, fried',                    emoji: '🧆', category: 'Legumes', calories: 333, protein_g: 13.3, carbs_g: 31.8, fat_g: 17.8, fiber_g: 4.9, sodium_mg: 294 },
  { name: 'Tofu, firm',                        emoji: '🍲', category: 'Legumes', calories: 144, protein_g: 15.8, carbs_g: 4.3,  fat_g: 8.7,  fiber_g: 2.3 },

  // ── Fruit ─────────────────────────────────────────────────────────────────
  { name: 'Banana, raw',                       emoji: '🍌', category: 'Fruit', calories: 89, protein_g: 1.09, carbs_g: 22.8, fat_g: 0.33, fiber_g: 2.6, sugar_g: 12.2 },
  { name: 'Apple, raw, with skin',             emoji: '🍎', category: 'Fruit', calories: 52, protein_g: 0.26, carbs_g: 13.8, fat_g: 0.17, fiber_g: 2.4, sugar_g: 10.4 },
  { name: 'Orange, raw',                       emoji: '🍊', category: 'Fruit', calories: 47, protein_g: 0.94, carbs_g: 11.8, fat_g: 0.12, fiber_g: 2.4, sugar_g: 9.35 },
  { name: 'Strawberries, raw',                 emoji: '🍓', category: 'Fruit', calories: 32, protein_g: 0.67, carbs_g: 7.68, fat_g: 0.3,  fiber_g: 2.0, sugar_g: 4.89 },
  { name: 'Grapes, raw',                       emoji: '🍇', category: 'Fruit', calories: 69, protein_g: 0.72, carbs_g: 18.1, fat_g: 0.16, fiber_g: 0.9, sugar_g: 15.5 },
  { name: 'Watermelon, raw',                   emoji: '🍉', category: 'Fruit', calories: 30, protein_g: 0.61, carbs_g: 7.55, fat_g: 0.15, fiber_g: 0.4, sugar_g: 6.2 },
  { name: 'Dates, medjool',                    emoji: '🌴', category: 'Fruit', calories: 277, protein_g: 1.81, carbs_g: 75.0, fat_g: 0.15, fiber_g: 6.7, sugar_g: 66.5 },
  { name: 'Avocado, raw',                      emoji: '🥑', category: 'Fruit', calories: 160, protein_g: 2.0,  carbs_g: 8.53, fat_g: 14.7, fiber_g: 6.7 },

  // ── Vegetables ────────────────────────────────────────────────────────────
  { name: 'Broccoli, raw',                     emoji: '🥦', category: 'Vegetables', calories: 34, protein_g: 2.82, carbs_g: 6.64, fat_g: 0.37, fiber_g: 2.6 },
  { name: 'Spinach, raw',                      emoji: '🥬', category: 'Vegetables', calories: 23, protein_g: 2.86, carbs_g: 3.63, fat_g: 0.39, fiber_g: 2.2, sodium_mg: 79 },
  { name: 'Tomato, raw',                       emoji: '🍅', category: 'Vegetables', calories: 18, protein_g: 0.88, carbs_g: 3.89, fat_g: 0.2,  fiber_g: 1.2 },
  { name: 'Cucumber, with peel, raw',          emoji: '🥒', category: 'Vegetables', calories: 15, protein_g: 0.65, carbs_g: 3.63, fat_g: 0.11, fiber_g: 0.5 },
  { name: 'Carrot, raw',                       emoji: '🥕', category: 'Vegetables', calories: 41, protein_g: 0.93, carbs_g: 9.58, fat_g: 0.24, fiber_g: 2.8, sodium_mg: 69 },
  { name: 'Onion, raw',                        emoji: '🧅', category: 'Vegetables', calories: 40, protein_g: 1.1,  carbs_g: 9.34, fat_g: 0.1,  fiber_g: 1.7 },
  { name: 'Romaine lettuce, raw',              emoji: '🥗', category: 'Vegetables', calories: 17, protein_g: 1.23, carbs_g: 3.29, fat_g: 0.3,  fiber_g: 2.1 },

  // ── Nuts, seeds, fats ─────────────────────────────────────────────────────
  { name: 'Almonds, raw',                      emoji: '🥜', category: 'Nuts', calories: 579, protein_g: 21.2, carbs_g: 21.6, fat_g: 49.9, fiber_g: 12.5 },
  { name: 'Walnuts, raw',                      emoji: '🥜', category: 'Nuts', calories: 654, protein_g: 15.2, carbs_g: 13.7, fat_g: 65.2, fiber_g: 6.7 },
  { name: 'Peanut butter, smooth',             emoji: '🥜', category: 'Nuts', calories: 588, protein_g: 25.1, carbs_g: 19.6, fat_g: 50.4, fiber_g: 6.0, sodium_mg: 429 },
  { name: 'Olive oil',                         emoji: '🫒', category: 'Fats', unit: 'ml', calories: 884, protein_g: 0, carbs_g: 0, fat_g: 100 },

  // ── Drinks ────────────────────────────────────────────────────────────────
  { name: 'Orange juice, raw',                 emoji: '🍊', category: 'Beverages', unit: 'ml', calories: 45, protein_g: 0.7,  carbs_g: 10.4, fat_g: 0.2, sugar_g: 8.4 },
  { name: 'Cola, carbonated',                  emoji: '🥤', category: 'Beverages', unit: 'ml', calories: 37, protein_g: 0.07, carbs_g: 9.56, fat_g: 0.02, sugar_g: 8.96, sodium_mg: 4 },
  { name: 'Coffee, brewed, black',             emoji: '☕', category: 'Beverages', unit: 'ml', calories: 1,  protein_g: 0.12, carbs_g: 0,    fat_g: 0.02 },
  { name: 'Tea, black, brewed',                emoji: '🍵', category: 'Beverages', unit: 'ml', calories: 1,  protein_g: 0,    carbs_g: 0.3,  fat_g: 0 },

  // ── Sweets and supplements ────────────────────────────────────────────────
  { name: 'Honey',                             emoji: '🍯', category: 'Sweets', calories: 304, protein_g: 0.3,  carbs_g: 82.4, fat_g: 0,    sugar_g: 82.1 },
  { name: 'Dark chocolate, 70-85% cacao',      emoji: '🍫', category: 'Sweets', calories: 598, protein_g: 7.79, carbs_g: 45.9, fat_g: 42.6, fiber_g: 10.9, sugar_g: 24.0 },
  { name: 'Whey protein isolate powder',       emoji: '💪', category: 'Supplements', calories: 370, protein_g: 80.0, carbs_g: 7.0, fat_g: 3.0, sodium_mg: 400 }
];
