-- Progress: body-weight history and user-defined goals.

CREATE TABLE weight_entries (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  weight_kg    DECIMAL(5,2)    NOT NULL,
  body_fat_pct DECIMAL(4,1)        NULL,
  notes        VARCHAR(300)        NULL,
  recorded_on  DATE            NOT NULL,
  created_at   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  -- One reading per day per user; logging again updates that day's value.
  UNIQUE KEY uq_weight_user_day (user_id, recorded_on),
  CONSTRAINT fk_weight_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE goals (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(160)    NOT NULL,
  icon          VARCHAR(16)     NOT NULL DEFAULT '🎯',
  -- `direction` replaces the old guesswork about whether lower is better.
  direction     ENUM('increase','decrease') NOT NULL DEFAULT 'increase',
  start_value   DECIMAL(10,2)   NOT NULL,
  current_value DECIMAL(10,2)   NOT NULL,
  target_value  DECIMAL(10,2)   NOT NULL,
  unit          VARCHAR(24)     NOT NULL DEFAULT '',
  deadline      DATE                NULL,
  completed_at  DATETIME(3)         NULL,
  created_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_goals_user (user_id, deadline),
  CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
