<?php
/**
 * WinPlayBox Game Arcade - Public Read/Write API
 * Handles server-side pagination, categories, and user data (favorites/recents)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

// Support both GET and POST for 'type'
$inputData = json_decode(file_get_contents('php://input'), true);
$type = isset($_GET['type']) ? $_GET['type'] : (isset($_POST['type']) ? $_POST['type'] : (isset($inputData['type']) ? $inputData['type'] : ''));

if (!$pdo) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection not configured.']);
    exit;
}

try {
    // ---------------------------------------------------------
    // 1. GET GAMES (With Server-Side Pagination & Filters)
    // ---------------------------------------------------------
    if ($type === 'games') {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = ($page - 1) * $limit;
        
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $category = isset($_GET['category']) ? trim($_GET['category']) : '';
        $rating = isset($_GET['rating']) ? (float)$_GET['rating'] : 0;
        $sort = isset($_GET['sort']) ? $_GET['sort'] : 'newest';
        
        $where = ["isActive=1"];
        $params = [];
        
        if (!empty($search)) {
            $where[] = "(title LIKE :search OR category LIKE :search OR tags LIKE :search)";
            $params['search'] = "%$search%";
        }
        
        if (!empty($category) && $category !== 'All') {
            $where[] = "category = :category";
            $params['category'] = $category;
        }
        
        if ($rating > 0) {
            $where[] = "rating >= :rating";
            $params['rating'] = $rating;
        }
        
        $orderBy = "created_at DESC";
        if ($sort === 'popular' || $sort === 'Most Popular' || $sort === 'Trending') {
            $orderBy = "rating DESC, created_at DESC";
        } elseif ($sort === 'Newest') {
            $orderBy = "created_at DESC";
        }
        
        $whereStr = implode(" AND ", $where);
        
        $stmt = $pdo->prepare("SELECT * FROM games WHERE $whereStr ORDER BY $orderBy LIMIT :limit OFFSET :offset");
        foreach($params as $k => $v) {
            $stmt->bindValue(":$k", $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $games = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($games as &$game) {
            $game['tags'] = $game['tags'] ? explode(',', $game['tags']) : [];
            $game['isActive'] = (bool)$game['isActive'];
            $game['isFeatured'] = (bool)$game['isFeatured'];
            $game['isPopular'] = (bool)$game['isPopular'];
        }
        
        echo json_encode($games);
    } 
    
    // ---------------------------------------------------------
    // 2. GET FEATURED GAMES (For Home Screen)
    // ---------------------------------------------------------
    elseif ($type === 'featured_games') {
        $stmt = $pdo->query("SELECT * FROM games WHERE isActive=1 AND isFeatured=1 ORDER BY created_at DESC LIMIT 10");
        $games = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($games as &$game) {
            $game['tags'] = $game['tags'] ? explode(',', $game['tags']) : [];
            $game['isActive'] = (bool)$game['isActive'];
            $game['isFeatured'] = (bool)$game['isFeatured'];
        }
        // If not enough featured, fallback to highest rated
        if(count($games) < 5) {
            $stmt = $pdo->query("SELECT * FROM games WHERE isActive=1 ORDER BY rating DESC LIMIT 10");
            $games = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($games as &$game) {
                $game['tags'] = $game['tags'] ? explode(',', $game['tags']) : [];
                $game['isActive'] = (bool)$game['isActive'];
                $game['isFeatured'] = (bool)$game['isFeatured'];
            }
        }
        echo json_encode($games);
    }
    
    // ---------------------------------------------------------
    // 3. GET POPULAR GAMES (For Home Screen)
    // ---------------------------------------------------------
    elseif ($type === 'popular_games') {
        $stmt = $pdo->query("SELECT * FROM games WHERE isActive=1 ORDER BY rating DESC LIMIT 15");
        $games = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($games as &$game) {
            $game['tags'] = $game['tags'] ? explode(',', $game['tags']) : [];
            $game['isActive'] = (bool)$game['isActive'];
            $game['isFeatured'] = (bool)$game['isFeatured'];
        }
        echo json_encode($games);
    }
    
    // ---------------------------------------------------------
    // 4. GET CATEGORIES
    // ---------------------------------------------------------
    elseif ($type === 'categories') {
        $stmt = $pdo->query("SELECT * FROM categories");
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($categories);
    }

    // ---------------------------------------------------------
    // 5. USER DATA API (POST/GET)
    // ---------------------------------------------------------
    elseif ($type === 'sync_user') {
        if(!isset($inputData['uid'])) { http_response_code(400); echo json_encode(['error'=>'Missing uid']); exit; }
        
        $stmt = $pdo->prepare("INSERT INTO users (id, email, name, lastLoginAt) VALUES (:id, :email, :name, NOW()) ON DUPLICATE KEY UPDATE lastLoginAt=NOW()");
        $stmt->execute([
            ':id' => $inputData['uid'],
            ':email' => $inputData['email'] ?? '',
            ':name' => $inputData['name'] ?? ''
        ]);
        echo json_encode(['success' => true]);
    }
    
    // FAVORITES
    elseif ($type === 'get_favorites') {
        $userId = $_GET['userId'] ?? '';
        $stmt = $pdo->prepare("SELECT g.* FROM favorites f JOIN games g ON f.gameId = g.id WHERE f.userId = :userId ORDER BY f.addedAt DESC");
        $stmt->execute([':userId' => $userId]);
        $games = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($games as &$game) {
            $game['tags'] = $game['tags'] ? explode(',', $game['tags']) : [];
            $game['isActive'] = (bool)$game['isActive'];
            $game['isFeatured'] = (bool)$game['isFeatured'];
        }
        echo json_encode($games);
    }
    elseif ($type === 'toggle_favorite') {
        $userId = $inputData['userId'] ?? '';
        $gameId = $inputData['gameId'] ?? '';
        
        $check = $pdo->prepare("SELECT 1 FROM favorites WHERE userId=:u AND gameId=:g");
        $check->execute([':u'=>$userId, ':g'=>$gameId]);
        if($check->fetch()) {
            // Remove
            $pdo->prepare("DELETE FROM favorites WHERE userId=:u AND gameId=:g")->execute([':u'=>$userId, ':g'=>$gameId]);
        } else {
            // Add
            $pdo->prepare("INSERT INTO favorites (userId, gameId) VALUES (:u, :g)")->execute([':u'=>$userId, ':g'=>$gameId]);
        }
        
        // Return updated favorites list
        $stmt = $pdo->prepare("SELECT g.* FROM favorites f JOIN games g ON f.gameId = g.id WHERE f.userId = :userId ORDER BY f.addedAt DESC");
        $stmt->execute([':userId' => $userId]);
        $games = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($games as &$game) {
            $game['tags'] = $game['tags'] ? explode(',', $game['tags']) : [];
        }
        echo json_encode($games);
    }
    elseif ($type === 'remove_multiple_favorites') {
        $userId = $inputData['userId'] ?? '';
        $gameIds = $inputData['gameIds'] ?? [];
        if($userId && !empty($gameIds)) {
            $inQuery = implode(',', array_fill(0, count($gameIds), '?'));
            $params = array_merge([$userId], $gameIds);
            $stmt = $pdo->prepare("DELETE FROM favorites WHERE userId = ? AND gameId IN ($inQuery)");
            $stmt->execute($params);
        }
        echo json_encode(['success' => true]);
    }
    elseif ($type === 'is_favorite') {
        $userId = $_GET['userId'] ?? '';
        $gameId = $_GET['gameId'] ?? '';
        $stmt = $pdo->prepare("SELECT 1 FROM favorites WHERE userId = :u AND gameId = :g");
        $stmt->execute([':u'=>$userId, ':g'=>$gameId]);
        echo json_encode(['isFavorite' => (bool)$stmt->fetch()]);
    }
    
    // RECENTS
    elseif ($type === 'get_recents') {
        $userId = $_GET['userId'] ?? '';
        $stmt = $pdo->prepare("SELECT g.*, r.timestamp, r.durationMs FROM recent_games r JOIN games g ON r.gameId = g.id WHERE r.userId = :userId ORDER BY r.timestamp DESC LIMIT 15");
        $stmt->execute([':userId' => $userId]);
        $games = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($games as &$game) {
            $game['tags'] = $game['tags'] ? explode(',', $game['tags']) : [];
            $game['durationMs'] = (int)$game['durationMs'];
            $game['timestamp'] = (int)$game['timestamp'];
        }
        echo json_encode($games);
    }
    elseif ($type === 'add_recent') {
        $userId = $inputData['userId'] ?? '';
        $gameId = $inputData['gameId'] ?? '';
        $durationMs = $inputData['durationMs'] ?? 0;
        $timestamp = time() * 1000;
        
        $stmt = $pdo->prepare("INSERT INTO recent_games (userId, gameId, timestamp, durationMs) VALUES (:u, :g, :t, :d) ON DUPLICATE KEY UPDATE timestamp=:t, durationMs=durationMs+:d");
        $stmt->execute([':u'=>$userId, ':g'=>$gameId, ':t'=>$timestamp, ':d'=>$durationMs]);
        echo json_encode(['success' => true]);
    }
    elseif ($type === 'remove_recent') {
        $userId = $inputData['userId'] ?? '';
        $gameId = $inputData['gameId'] ?? '';
        $pdo->prepare("DELETE FROM recent_games WHERE userId = :u AND gameId = :g")->execute([':u'=>$userId, ':g'=>$gameId]);
        echo json_encode(['success' => true]);
    }
    
    // RATINGS
    elseif ($type === 'get_ratings') {
        $userId = $_GET['userId'] ?? '';
        $stmt = $pdo->prepare("SELECT gameId as id, rating, reviewText, updatedAt FROM user_ratings WHERE userId = :userId");
        $stmt->execute([':userId' => $userId]);
        $ratings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Return as key-value map like local SQLite did: { "g_123": { rating: 5, reviewText: "", updatedAt: "..." } }
        $ratingsObj = [];
        foreach ($ratings as $r) {
            $ratingsObj[$r['id']] = [
                'rating' => (float)$r['rating'],
                'reviewText' => $r['reviewText'],
                'updatedAt' => $r['updatedAt']
            ];
        }
        echo json_encode($ratingsObj);
    }
    elseif ($type === 'save_rating') {
        $userId = $inputData['userId'] ?? '';
        $gameId = $inputData['gameId'] ?? '';
        $rating = $inputData['rating'] ?? 5.0;
        $reviewText = $inputData['reviewText'] ?? '';
        
        if (!$userId || !$gameId) {
            http_response_code(400); echo json_encode(['error'=>'Missing userId or gameId']); exit;
        }
        
        $stmt = $pdo->prepare("INSERT INTO user_ratings (userId, gameId, rating, reviewText) VALUES (:u, :g, :r, :t) ON DUPLICATE KEY UPDATE rating=:r, reviewText=:t");
        $stmt->execute([':u'=>$userId, ':g'=>$gameId, ':r'=>$rating, ':t'=>$reviewText]);
        
        echo json_encode(['success' => true]);
    }
    
    // ---------------------------------------------------------
    // 6. SUBMISSIONS & REPORTS (POST)
    // ---------------------------------------------------------
    elseif ($type === 'submit_game') {
        $userId = $inputData['userId'] ?? null;
        $title = $inputData['title'] ?? '';
        $ownerName = $inputData['ownerName'] ?? '';
        $ownerEmail = $inputData['ownerEmail'] ?? '';
        $gameUrl = $inputData['gameUrl'] ?? '';
        $category = $inputData['category'] ?? '';
        $description = $inputData['description'] ?? '';
        
        $stmt = $pdo->prepare("INSERT INTO game_submissions (userId, title, ownerName, ownerEmail, gameUrl, category, description) VALUES (:u, :t, :n, :e, :url, :c, :d)");
        $stmt->execute([':u'=>$userId, ':t'=>$title, ':n'=>$ownerName, ':e'=>$ownerEmail, ':url'=>$gameUrl, ':c'=>$category, ':d'=>$description]);
        echo json_encode(['success' => true]);
    }
    elseif ($type === 'report_issue') {
        $userId = $inputData['userId'] ?? null;
        $gameId = $inputData['gameId'] ?? null;
        $gameTitle = $inputData['gameTitle'] ?? '';
        $issueType = $inputData['issueType'] ?? '';
        $details = $inputData['details'] ?? '';
        
        $stmt = $pdo->prepare("INSERT INTO issue_reports (userId, gameId, gameTitle, issueType, details) VALUES (:u, :id, :t, :i, :d)");
        $stmt->execute([':u'=>$userId, ':id'=>$gameId, ':t'=>$gameTitle, ':i'=>$issueType, ':d'=>$details]);
        echo json_encode(['success' => true]);
    }
    elseif ($type === 'log_ad') {
        $userId = $inputData['userId'] ?? 'anonymous';
        $adType = $inputData['adType'] ?? 'unknown';
        $screen = $inputData['screen'] ?? '';
        $activity = $inputData['activity'] ?? '';
        
        $stmt = $pdo->prepare("INSERT INTO ad_logs (userId, adType, screen, activity) VALUES (:u, :t, :s, :a)");
        $stmt->execute([':u'=>$userId, ':t'=>$adType, ':s'=>$screen, ':a'=>$activity]);
        echo json_encode(['success' => true]);
    }
    
    // ---------------------------------------------------------
    // 7. USER PROFILE (GET/POST)
    // ---------------------------------------------------------
    elseif ($type === 'get_profile') {
        $userId = $_GET['userId'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :userId");
        $stmt->execute([':userId' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $user['appLockEnabled'] = (bool)$user['appLockEnabled'];
            $user['hasRatedApp'] = (bool)$user['hasRatedApp'];
            $user['adsEnabled'] = (bool)$user['adsEnabled'];
            echo json_encode($user);
        } else {
            echo json_encode(['appLockEnabled' => false, 'hasRatedApp' => false, 'adsEnabled' => true]);
        }
    }
    elseif ($type === 'update_profile') {
        $userId = $inputData['userId'] ?? '';
        if (!$userId) { http_response_code(400); echo json_encode(['error'=>'Missing userId']); exit; }
        
        $fields = [];
        $params = [':userId' => $userId];
        
        if (isset($inputData['appLockEnabled'])) {
            $fields[] = "appLockEnabled = :appLock";
            $params[':appLock'] = $inputData['appLockEnabled'] ? 1 : 0;
        }
        if (isset($inputData['hasRatedApp'])) {
            $fields[] = "hasRatedApp = :hasRated";
            $params[':hasRated'] = $inputData['hasRatedApp'] ? 1 : 0;
        }
        
        if (count($fields) > 0) {
            $setStr = implode(', ', $fields);
            $stmt = $pdo->prepare("UPDATE users SET $setStr WHERE id = :userId");
            $stmt->execute($params);
        }
        echo json_encode(['success' => true]);
    }
    elseif ($type === 'reset_profile') {
        $userId = $inputData['userId'] ?? '';
        if (!$userId) { http_response_code(400); echo json_encode(['error'=>'Missing userId']); exit; }
        
        // Delete history
        $pdo->prepare("DELETE FROM recent_games WHERE userId = :userId")->execute([':userId' => $userId]);
        // Delete favorites
        $pdo->prepare("DELETE FROM favorites WHERE userId = :userId")->execute([':userId' => $userId]);
        // Reset app lock (but keep ads and rate app)
        $pdo->prepare("UPDATE users SET appLockEnabled = 0 WHERE id = :userId")->execute([':userId' => $userId]);
        
        echo json_encode(['success' => true]);
    }
    
    else {
        http_response_code(400);
        echo json_encode(['error' => "Invalid or missing type parameter: $type"]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Query failed: ' . $e->getMessage()]);
}
