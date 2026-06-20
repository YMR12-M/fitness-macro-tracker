-- ================================================
-- FitTrack Pro - MySQL Database Schema
-- Run this file to initialize the database
-- ================================================

CREATE DATABASE IF NOT EXISTS fittrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fittrack;

-- ── USERS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)                    NOT NULL,
    email         VARCHAR(150) UNIQUE             NOT NULL,
    password_hash VARCHAR(255)                    NOT NULL,
    age           TINYINT UNSIGNED,
    height_cm     DECIMAL(5,1),
    weight_kg     DECIMAL(5,1),
    goal_type     ENUM('cut','bulk','maintain')   DEFAULT 'maintain',
    calorie_goal  SMALLINT UNSIGNED               DEFAULT 2000,
    created_at    TIMESTAMP                       DEFAULT CURRENT_TIMESTAMP
);

-- ── MEALS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS meals (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT            NOT NULL,
    name        VARCHAR(150)   NOT NULL,
    emoji       VARCHAR(10)    DEFAULT '🍽️',
    meal_type   ENUM('breakfast','lunch','dinner','snack') DEFAULT 'lunch',
    calories    SMALLINT UNSIGNED NOT NULL,
    protein     DECIMAL(6,1)   DEFAULT 0,
    carbs       DECIMAL(6,1)   DEFAULT 0,
    fat         DECIMAL(6,1)   DEFAULT 0,
    quantity_g  SMALLINT       DEFAULT 100,
    date        DATE           NOT NULL,
    created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_meals_user_date (user_id, date)
);

-- ── FOOD DATABASE ──────────────────────────────
CREATE TABLE IF NOT EXISTS food_database (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150)   NOT NULL,
    emoji       VARCHAR(10)    DEFAULT '🍽️',
    calories    SMALLINT UNSIGNED NOT NULL COMMENT 'per 100g or 100ml',
    protein     DECIMAL(6,1)   DEFAULT 0,
    carbs       DECIMAL(6,1)   DEFAULT 0,
    fat         DECIMAL(6,1)   DEFAULT 0,
    fiber       DECIMAL(6,1)   DEFAULT 0,
    sugar       DECIMAL(6,1)   DEFAULT 0,
    per_unit    VARCHAR(20)    DEFAULT '100g',
    category    VARCHAR(50),
    INDEX idx_food_name (name)
);

-- ── WORKOUTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS workouts (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT          NOT NULL,
    workout_type      VARCHAR(100) NOT NULL,
    duration_minutes  TINYINT UNSIGNED DEFAULT 0,
    calories_burned   SMALLINT UNSIGNED DEFAULT 0,
    intensity         ENUM('light','moderate','intense') DEFAULT 'moderate',
    notes             TEXT,
    date              DATE         NOT NULL,
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_workouts_user_date (user_id, date)
);

-- ── EXERCISES (workout sets) ───────────────────
CREATE TABLE IF NOT EXISTS exercise_sets (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    workout_id  INT          NOT NULL,
    name        VARCHAR(100) NOT NULL,
    sets        TINYINT      DEFAULT 3,
    reps        TINYINT      DEFAULT 10,
    weight_kg   DECIMAL(5,1) DEFAULT 0,
    notes       VARCHAR(200),
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);

-- ── WEIGHT LOG ────────────────────────────────
CREATE TABLE IF NOT EXISTS weight_log (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT         NOT NULL,
    weight_kg  DECIMAL(5,1) NOT NULL,
    body_fat   DECIMAL(4,1),
    muscle_pct DECIMAL(4,1),
    notes      VARCHAR(300),
    date       DATE        NOT NULL,
    logged_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_weight_user_date (user_id, date)
);

-- ── GOALS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT          NOT NULL,
    name          VARCHAR(150) NOT NULL,
    icon          VARCHAR(10)  DEFAULT '🎯',
    current_value DECIMAL(8,2) DEFAULT 0,
    target_value  DECIMAL(8,2) NOT NULL,
    unit          VARCHAR(30)  DEFAULT '',
    deadline      DATE         NOT NULL,
    completed     BOOLEAN      DEFAULT FALSE,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── WATER LOG ─────────────────────────────────
CREATE TABLE IF NOT EXISTS water_log (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT              NOT NULL,
    amount_ml  SMALLINT UNSIGNED NOT NULL,
    date       DATE             NOT NULL,
    logged_at  TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── SEED: Food Database ────────────────────────
INSERT IGNORE INTO food_database (name, emoji, calories, protein, carbs, fat, per_unit, category) VALUES
('Grilled chicken breast',   '🍗', 165, 31.0,  0.0,  3.6, '100g', 'protein'),
('Cooked white rice',  '🍚', 206,  4.3, 44.5,  0.4, '100g', 'carbs'),
('Boiled eggs',       '🥚', 155, 13.0,  1.1, 11.0, '100g', 'protein'),
('Toast bread',        '🍞', 265,  9.0, 49.0,  3.2, '100g', 'carbs'),
('Banana',             '🍌',  89,  1.1, 23.0,  0.3, '100g', 'fruit'),
('Apple',            '🍎',  52,  0.3, 14.0,  0.2, '100g', 'fruit'),
('Cow milk',        '🥛',  61,  3.2,  4.8,  3.3, '100ml','dairy'),
('Plain yogurt',      '🥣',  59,  3.5,  5.0,  3.3, '100g', 'dairy'),
('Salmon',       '🐟', 208, 20.0,  0.0, 13.0, '100g', 'protein'),
('Cooked lentils',       '🫘', 116,  9.0, 20.0,  0.4, '100g', 'legumes'),
('Beef',        '🥩', 217, 26.0,  0.0, 12.0, '100g', 'protein'),
('Walnuts',             '🥜', 654, 15.0, 14.0, 65.0, '100g', 'nuts'),
('Avocado',         '🥑', 160,  2.0,  9.0, 15.0, '100g', 'vegetables'),
('Roasted potato',     '🥔',  77,  2.0, 17.0,  0.1, '100g', 'carbs'),
('oatmeal',           '🥣', 389, 17.0, 66.0,  7.0, '100g', 'carbs'),
('Cooked pasta',   '🍝', 131,  5.0, 25.0,  1.1, '100g', 'carbs'),
('Green salad',      '🥗',  20,  1.5,  3.0,  0.3, '100g', 'vegetables'),
('Orange juice',     '🍊',  45,  0.7, 10.0,  0.2, '100ml','beverages'),
('Olive oil',       '🫒', 884,  0.0,  0.0,100.0, '100ml','fat'),
('Canned tuna',      '🐠', 132, 29.0,  0.0,  1.0, '100g', 'protein');

-- ── SEED: Demo User ────────────────────────────
INSERT IGNORE INTO users (id, name, email, password_hash, age, height_cm, weight_kg, goal_type, calorie_goal)
VALUES (1, 'Ahmed Hassan', 'ahmed@fittrack.com', '$2y$10$demoHashedPassword', 28, 178.0, 82.5, 'cut', 2000);
