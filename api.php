<?php
/**
 * FitTrack Pro - PHP REST API Backend
 * Handles: meals, workouts, goals, weight logs
 * 
 * Usage: https://yourdomain.com/api.php?resource=meals
 * Methods: GET, POST, PUT, DELETE
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// ─────────────────────────────
// DATABASE CONNECTION
// ─────────────────────────────
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'fittrack');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER, DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                 PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit();
        }
    }
    return $pdo;
}

// ─────────────────────────────
// ROUTER
// ─────────────────────────────
$resource = $_GET['resource'] ?? '';
$id       = $_GET['id'] ?? null;
$method   = $_SERVER['REQUEST_METHOD'];
$body     = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($resource) {
    case 'meals':    handleMeals($method, $id, $body);    break;
    case 'workouts': handleWorkouts($method, $id, $body); break;
    case 'goals':    handleGoals($method, $id, $body);    break;
    case 'weight':   handleWeight($method, $id, $body);   break;
    case 'foods':    handleFoods($method, $id, $body);    break;
    case 'summary':  handleSummary();                     break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Resource not found', 'available' => ['meals','workouts','goals','weight','foods','summary']]);
}

// ─────────────────────────────
// MEALS
// ─────────────────────────────
function handleMeals(string $method, ?string $id, array $body): void {
    $db = getDB();

    if ($method === 'GET') {
        $date = $_GET['date'] ?? date('Y-m-d');
        $user = $_GET['user_id'] ?? 1;
        $stmt = $db->prepare('SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY created_at DESC');
        $stmt->execute([$user, $date]);
        respond(['date' => $date, 'meals' => $stmt->fetchAll()]);

    } elseif ($method === 'POST') {
        validateRequired($body, ['user_id','name','calories','meal_type']);
        $stmt = $db->prepare('INSERT INTO meals (user_id, name, emoji, meal_type, calories, protein, carbs, fat, date, created_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
        $stmt->execute([
            $body['user_id'],
            $body['name'],
            $body['emoji']      ?? '🍽️',
            $body['meal_type'],
            $body['calories'],
            $body['protein']    ?? 0,
            $body['carbs']      ?? 0,
            $body['fat']        ?? 0,
            $body['date']       ?? date('Y-m-d'),
        ]);
        respond(['id' => $db->lastInsertId(), 'message' => 'Meal added successfully'], 201);

    } elseif ($method === 'DELETE' && $id) {
        $stmt = $db->prepare('DELETE FROM meals WHERE id = ?');
        $stmt->execute([$id]);
        respond(['message' => 'Meal deleted successfully']);
    }
}

// ─────────────────────────────
// WORKOUTS
// ─────────────────────────────
function handleWorkouts(string $method, ?string $id, array $body): void {
    $db = getDB();

    if ($method === 'GET') {
        $user = $_GET['user_id'] ?? 1;
        $stmt = $db->prepare('SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC LIMIT 30');
        $stmt->execute([$user]);
        respond(['workouts' => $stmt->fetchAll()]);

    } elseif ($method === 'POST') {
        validateRequired($body, ['user_id','workout_type','duration_minutes']);
        $stmt = $db->prepare('INSERT INTO workouts (user_id, workout_type, duration_minutes, calories_burned, intensity, notes, date)
                              VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $body['user_id'],
            $body['workout_type'],
            $body['duration_minutes'],
            $body['calories_burned'] ?? 0,
            $body['intensity']       ?? 'moderate',
            $body['notes']           ?? '',
            $body['date']            ?? date('Y-m-d'),
        ]);
        respond(['id' => $db->lastInsertId(), 'message' => 'Workout recorded successfully'], 201);

    } elseif ($method === 'DELETE' && $id) {
        $db->prepare('DELETE FROM workouts WHERE id = ?')->execute([$id]);
        respond(['message' => 'Workout deleted successfully']);
    }
}

// ─────────────────────────────
// GOALS
// ─────────────────────────────
function handleGoals(string $method, ?string $id, array $body): void {
    $db = getDB();

    if ($method === 'GET') {
        $user = $_GET['user_id'] ?? 1;
        $stmt = $db->prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY deadline ASC');
        $stmt->execute([$user]);
        respond(['goals' => $stmt->fetchAll()]);

    } elseif ($method === 'POST') {
        validateRequired($body, ['user_id','name','target_value','deadline']);
        $stmt = $db->prepare('INSERT INTO goals (user_id, name, icon, current_value, target_value, unit, deadline)
                              VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $body['user_id'],
            $body['name'],
            $body['icon']          ?? '🎯',
            $body['current_value'] ?? 0,
            $body['target_value'],
            $body['unit']          ?? '',
            $body['deadline'],
        ]);
        respond(['id' => $db->lastInsertId(), 'message' => 'Goal added successfully'], 201);

    } elseif ($method === 'PUT' && $id) {
        $stmt = $db->prepare('UPDATE goals SET current_value = ? WHERE id = ?');
        $stmt->execute([$body['current_value'], $id]);
        respond(['message' => 'Goal updated successfully']);

    } elseif ($method === 'DELETE' && $id) {
        $db->prepare('DELETE FROM goals WHERE id = ?')->execute([$id]);
        respond(['message' => 'Goal deleted successfully']);
    }
}

// ─────────────────────────────
// WEIGHT LOG
// ─────────────────────────────
function handleWeight(string $method, ?string $id, array $body): void {
    $db = getDB();

    if ($method === 'GET') {
        $user = $_GET['user_id'] ?? 1;
        $stmt = $db->prepare('SELECT * FROM weight_log WHERE user_id = ? ORDER BY date ASC LIMIT 60');
        $stmt->execute([$user]);
        $rows = $stmt->fetchAll();
        $latest = end($rows);
        respond(['entries' => $rows, 'latest_kg' => $latest ? $latest['weight_kg'] : null]);

    } elseif ($method === 'POST') {
        validateRequired($body, ['user_id','weight_kg']);
        $stmt = $db->prepare('INSERT INTO weight_log (user_id, weight_kg, notes, date) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $body['user_id'],
            $body['weight_kg'],
            $body['notes'] ?? '',
            $body['date']  ?? date('Y-m-d'),
        ]);
        respond(['id' => $db->lastInsertId(), 'message' => 'Weight logged successfully'], 201);
    }
}

// ─────────────────────────────
// FOOD DATABASE SEARCH
// ─────────────────────────────
function handleFoods(string $method, ?string $id, array $body): void {
    $db = getDB();
    $query = $_GET['q'] ?? '';

    if ($method === 'GET') {
        if ($query) {
            $stmt = $db->prepare('SELECT * FROM food_database WHERE name LIKE ? LIMIT 20');
            $stmt->execute(['%' . $query . '%']);
        } else {
            $stmt = $db->query('SELECT * FROM food_database ORDER BY name LIMIT 50');
        }
        respond(['foods' => $stmt->fetchAll()]);
    }
}

// ─────────────────────────────
// DAILY SUMMARY
// ─────────────────────────────
function handleSummary(): void {
    $db   = getDB();
    $user = $_GET['user_id'] ?? 1;
    $date = $_GET['date']    ?? date('Y-m-d');

    $mStmt = $db->prepare('SELECT SUM(calories) as total_cal, SUM(protein) as total_prot,
                                  SUM(carbs) as total_carbs, SUM(fat) as total_fat
                           FROM meals WHERE user_id = ? AND date = ?');
    $mStmt->execute([$user, $date]);
    $macros = $mStmt->fetch();

    $wStmt = $db->prepare('SELECT SUM(calories_burned) as total_burned, SUM(duration_minutes) as total_min
                           FROM workouts WHERE user_id = ? AND date = ?');
    $wStmt->execute([$user, $date]);
    $workout = $wStmt->fetch();

    respond([
        'date'     => $date,
        'calories' => [
            'eaten'   => (int)($macros['total_cal']   ?? 0),
            'burned'  => (int)($workout['total_burned'] ?? 0),
            'net'     => (int)(($macros['total_cal'] ?? 0) - ($workout['total_burned'] ?? 0)),
            'goal'    => 2000,
        ],
        'macros'  => [
            'protein' => round($macros['total_prot']  ?? 0, 1),
            'carbs'   => round($macros['total_carbs'] ?? 0, 1),
            'fat'     => round($macros['total_fat']   ?? 0, 1),
        ],
        'workout' => [
            'minutes' => (int)($workout['total_min'] ?? 0),
        ],
    ]);
}

// ─────────────────────────────
// HELPERS
// ─────────────────────────────
function respond(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

function validateRequired(array $body, array $fields): void {
    $missing = array_filter($fields, fn($f) => !isset($body[$f]));
    if ($missing) {
        http_response_code(422);
        echo json_encode(['error' => 'Missing required fields', 'fields' => array_values($missing)]);
        exit();
    }
}
