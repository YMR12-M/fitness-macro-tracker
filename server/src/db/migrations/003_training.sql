-- Training: programs a user can follow, logged sessions, and per-set detail.

CREATE TABLE programs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(80)     NOT NULL,
  name        VARCHAR(160)    NOT NULL,
  emoji       VARCHAR(16)         NULL,
  description TEXT                NULL,
  days_per_week TINYINT UNSIGNED NOT NULL,
  level       ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  accent      CHAR(7)             NULL,
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_programs_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The template: which exercises a program prescribes on a given day.
CREATE TABLE program_exercises (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  program_id  BIGINT UNSIGNED NOT NULL,
  day_index   TINYINT UNSIGNED NOT NULL,
  day_label   VARCHAR(60)     NOT NULL,
  name        VARCHAR(160)    NOT NULL,
  muscle      VARCHAR(60)         NULL,
  target_sets TINYINT UNSIGNED NOT NULL DEFAULT 3,
  target_reps VARCHAR(24)     NOT NULL DEFAULT '10',
  position    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_prog_ex_day (program_id, day_index, position),
  CONSTRAINT fk_prog_ex_program FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_programs (
  user_id    BIGINT UNSIGNED NOT NULL,
  program_id BIGINT UNSIGNED NOT NULL,
  started_on DATE            NOT NULL,
  active     TINYINT(1)      NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, program_id),
  CONSTRAINT fk_user_programs_user    FOREIGN KEY (user_id)    REFERENCES users (id)    ON DELETE CASCADE,
  CONSTRAINT fk_user_programs_program FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workouts (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          BIGINT UNSIGNED NOT NULL,
  program_id       BIGINT UNSIGNED     NULL,
  workout_type     VARCHAR(80)     NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  calories_burned  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  intensity        ENUM('low','moderate','high') NOT NULL DEFAULT 'moderate',
  notes            VARCHAR(500)        NULL,
  performed_on     DATE            NOT NULL,
  created_at       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_workouts_user_day (user_id, performed_on),
  CONSTRAINT fk_workouts_user    FOREIGN KEY (user_id)    REFERENCES users (id)    ON DELETE CASCADE,
  CONSTRAINT fk_workouts_program FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Per-set detail is what makes progressive-overload charts possible.
CREATE TABLE workout_sets (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workout_id    BIGINT UNSIGNED NOT NULL,
  exercise_name VARCHAR(160)    NOT NULL,
  muscle        VARCHAR(60)         NULL,
  set_number    TINYINT UNSIGNED NOT NULL,
  reps          SMALLINT UNSIGNED   NULL,
  weight_kg     DECIMAL(6,2)        NULL,
  completed     TINYINT(1)      NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_sets_workout (workout_id, exercise_name, set_number),
  CONSTRAINT fk_sets_workout FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
