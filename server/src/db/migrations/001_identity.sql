-- Identity: accounts, profile/targets, and refresh-token sessions.

CREATE TABLE users (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email          VARCHAR(255)    NOT NULL,
  password_hash  VARCHAR(255)    NOT NULL,
  name           VARCHAR(120)    NOT NULL,
  email_verified TINYINT(1)      NOT NULL DEFAULT 0,
  created_at     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per user. Holds the body stats the TDEE calculator needs and the
-- daily targets every summary is measured against, so nothing is hardcoded.
CREATE TABLE user_profiles (
  user_id        BIGINT UNSIGNED NOT NULL,
  sex            ENUM('male','female')                                        NULL,
  birth_date     DATE                                                         NULL,
  height_cm      DECIMAL(5,1)                                                 NULL,
  activity_level ENUM('sedentary','light','moderate','active','very_active') NOT NULL DEFAULT 'moderate',
  goal_type      ENUM('cut','maintain','bulk')                               NOT NULL DEFAULT 'maintain',
  calorie_goal   SMALLINT UNSIGNED NOT NULL DEFAULT 2000,
  protein_goal_g SMALLINT UNSIGNED NOT NULL DEFAULT 150,
  carbs_goal_g   SMALLINT UNSIGNED NOT NULL DEFAULT 220,
  fat_goal_g     SMALLINT UNSIGNED NOT NULL DEFAULT 65,
  water_goal_ml  SMALLINT UNSIGNED NOT NULL DEFAULT 2500,
  units          ENUM('metric','imperial') NOT NULL DEFAULT 'metric',
  theme          ENUM('dark','light')      NOT NULL DEFAULT 'dark',
  timezone       VARCHAR(64)  NOT NULL DEFAULT 'UTC',
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens are stored hashed: a database leak must not hand out sessions.
CREATE TABLE sessions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  CHAR(64)        NOT NULL,
  user_agent  VARCHAR(255)        NULL,
  ip_address  VARCHAR(45)         NULL,
  expires_at  DATETIME(3)     NOT NULL,
  revoked_at  DATETIME(3)         NULL,
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token (token_hash),
  KEY idx_sessions_user (user_id, expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
