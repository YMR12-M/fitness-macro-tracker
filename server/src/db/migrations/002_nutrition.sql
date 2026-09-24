-- Nutrition: the food catalog, logged meals, and water intake.

-- Food catalog. Nutrients are per 100 g/ml unless serving_size says otherwise,
-- matching the USDA convention. Three provenances, kept distinct so the origin
-- of any number is always answerable:
--   usda   — fetched live from USDA FoodData Central and cached here
--   seed   — USDA-derived reference values shipped with the repo, so search
--            works before an API key is configured
--   custom — created by a user, visible only to them
CREATE TABLE foods (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source        ENUM('usda','seed','custom') NOT NULL DEFAULT 'usda',
  fdc_id        INT UNSIGNED        NULL,
  name          VARCHAR(255)    NOT NULL,
  brand         VARCHAR(180)        NULL,
  category      VARCHAR(120)        NULL,
  emoji         VARCHAR(16)         NULL,
  serving_size  DECIMAL(8,2)    NOT NULL DEFAULT 100.00,
  serving_unit  ENUM('g','ml','piece','scoop','cup','tbsp','tsp') NOT NULL DEFAULT 'g',
  calories      DECIMAL(8,2)    NOT NULL,
  protein_g     DECIMAL(7,2)    NOT NULL DEFAULT 0,
  carbs_g       DECIMAL(7,2)    NOT NULL DEFAULT 0,
  fat_g         DECIMAL(7,2)    NOT NULL DEFAULT 0,
  fiber_g       DECIMAL(7,2)        NULL,
  sugar_g       DECIMAL(7,2)        NULL,
  sodium_mg     DECIMAL(9,2)        NULL,
  created_by    BIGINT UNSIGNED     NULL,
  created_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_foods_fdc (fdc_id),
  KEY idx_foods_owner (created_by),
  FULLTEXT KEY ft_foods_name (name, brand),
  CONSTRAINT fk_foods_user FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A logged meal. Macros are denormalised onto the row on purpose: editing a
-- food later must not silently rewrite what a user already ate.
CREATE TABLE meal_entries (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  food_id     BIGINT UNSIGNED     NULL,
  name        VARCHAR(255)    NOT NULL,
  emoji       VARCHAR(16)         NULL,
  meal_type   ENUM('breakfast','lunch','dinner','snack') NOT NULL DEFAULT 'lunch',
  quantity    DECIMAL(8,2)    NOT NULL DEFAULT 100.00,
  unit        ENUM('g','ml','piece','scoop','cup','tbsp','tsp') NOT NULL DEFAULT 'g',
  calories    DECIMAL(8,2)    NOT NULL,
  protein_g   DECIMAL(7,2)    NOT NULL DEFAULT 0,
  carbs_g     DECIMAL(7,2)    NOT NULL DEFAULT 0,
  fat_g       DECIMAL(7,2)    NOT NULL DEFAULT 0,
  logged_on   DATE            NOT NULL,
  logged_at   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_meals_user_day (user_id, logged_on),
  KEY idx_meals_food (food_id),
  CONSTRAINT fk_meals_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_meals_food FOREIGN KEY (food_id) REFERENCES foods (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE water_entries (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  amount_ml  SMALLINT UNSIGNED NOT NULL,
  logged_on  DATE            NOT NULL,
  logged_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_water_user_day (user_id, logged_on),
  CONSTRAINT fk_water_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
