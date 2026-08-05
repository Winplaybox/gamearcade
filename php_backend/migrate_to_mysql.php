<?php
/**
 * WinPlayBox Game Arcade - Firestore to MySQL Migration Tool
 * 
 * Run this script ONCE in your browser to copy all your existing
 * Games and Categories from Firestore directly into your new MySQL tables.
 */

require_once 'config.php';

// A simple security key to prevent accidental runs
$SECRET_KEY = 'winplaybox2026';
$keyParam = isset($_GET['key']) ? $_GET['key'] : '';

if ($keyParam !== $SECRET_KEY) {
    die("<h1>Access Denied</h1><p>Please provide the correct ?key= parameter to run the migration.</p>");
}

if (!$pdo) {
    die("<h1>Database Error</h1><p>Please configure your MySQL database credentials in <code>config.php</code> first.</p>");
}

echo "<h1>Starting Migration from Firestore to MySQL...</h1>";

// 1. Migrate Categories
echo "<h2>Migrating Categories...</h2>";
$categories = getCollection('categories'); // Ensure this matches your Firestore collection name
$catCount = 0;

if (!empty($categories)) {
    $stmt = $pdo->prepare("INSERT IGNORE INTO categories (id, title, icon, themeColor) VALUES (?, ?, ?, ?)");
    foreach ($categories as $cat) {
        try {
            $stmt->execute([
                $cat['id'],
                $cat['title'] ?? 'Unknown',
                $cat['icon'] ?? 'game-controller-outline',
                $cat['themeColor'] ?? '#E94560'
            ]);
            $catCount++;
        } catch (PDOException $e) {
            echo "<p style='color:red;'>Error migrating category {$cat['id']}: " . $e->getMessage() . "</p>";
        }
    }
}
echo "<p style='color:green;'>Successfully migrated $catCount categories!</p>";


// 2. Migrate Games
echo "<h2>Migrating Games...</h2>";
$games = getCollection('games'); // Fetch all games from Firestore
$gameCount = 0;

if (!empty($games)) {
    $stmt = $pdo->prepare("INSERT IGNORE INTO games (id, title, description, iconUrl, gameUrl, category, tags, isActive, isFeatured, isPopular, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    foreach ($games as $game) {
        try {
            // Handle tags array
            $tagsStr = '';
            if (isset($game['tags']) && is_array($game['tags'])) {
                $tagsStr = implode(', ', $game['tags']);
            } elseif (isset($game['tags'])) {
                $tagsStr = (string)$game['tags'];
            }

            $stmt->execute([
                $game['id'],
                $game['title'] ?? 'Unknown Game',
                $game['description'] ?? '',
                $game['iconUrl'] ?? $game['thumbnail'] ?? '',
                $game['url'] ?? $game['gameUrl'] ?? '',
                $game['category'] ?? 'Arcade',
                $tagsStr,
                1, // isActive (default true)
                !empty($game['isFeatured']) ? 1 : 0,
                !empty($game['isPopular']) ? 1 : 0,
                $game['rating'] ?? '4.5'
            ]);
            $gameCount++;
        } catch (PDOException $e) {
            echo "<p style='color:red;'>Error migrating game {$game['id']}: " . $e->getMessage() . "</p>";
        }
    }
}
echo "<p style='color:green;'>Successfully migrated $gameCount games!</p>";

echo "<h2>🎉 Migration Complete!</h2>";
echo "<p>You can now go to <a href='admin.php'>admin.php</a> to view your catalog in MySQL.</p>";
echo "<p><strong>IMPORTANT:</strong> For security, please delete this <code>migrate_to_mysql.php</code> file from your Hostinger server after you are done.</p>";
?>
