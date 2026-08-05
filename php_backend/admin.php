<?php
/**
 * WinPlayBox Game Arcade - Master Admin Panel
 * Manage Games, Categories (MySQL), Auto-Sync RSS Feeds, HTML5Games Scraper, and Firebase.
 */

require_once 'config.php';

$SECRET_KEY = 'winplaybox2026';
session_start();

// Handle login
if (isset($_POST['login_key'])) {
    if ($_POST['login_key'] === $SECRET_KEY) {
        $_SESSION['admin_logged_in'] = true;
    }
}
if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: admin.php");
    exit;
}
if (!isset($_SESSION['admin_logged_in'])) {
    echo '<!DOCTYPE html><html><head><title>Admin Login</title><style>body{font-family:sans-serif;background:#f5f7fa;display:flex;justify-content:center;align-items:center;height:100vh;} .box{background:#fff;padding:30px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);text-align:center;} input{padding:10px;margin:10px 0;width:100%;box-sizing:border-box;} button{padding:10px 20px;background:#E94560;color:#fff;border:none;border-radius:4px;cursor:pointer;}</style></head><body>';
    echo '<div class="box"><h2>Game Arcade Admin</h2><form method="POST"><input type="password" name="login_key" placeholder="Enter Secret Key" required /><br><button type="submit">Login</button></form></div>';
    echo '</body></html>';
    exit;
}

if (!$pdo) {
    die("<h1>Database Error</h1><p>Please configure your MySQL database credentials in <code>config.php</code> first.</p>");
}

$message = '';

// Content Safety blocklist
$blocklist = ['adult', 'gore', 'casino', 'gambling', 'erotic', 'nsfw', 'sexy', '18+', 'nude', 'sex', 'poker', 'slots', 'betting', 'casino games'];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    // ─── API PROXY ENDPOINT ───
    if ($_POST['action'] === 'proxy_fetch') {
        $url = trim($_POST['url'] ?? '');
        if (empty($url)) {
            echo json_encode(['error' => 'No URL provided']);
            exit;
        }
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $html = curl_exec($ch);
        curl_close($ch);
        echo json_encode(['html' => $html]);
        exit;
    }
    
    // ─── NORMAL FORM ACTIONS ───
    try {
        if ($_POST['action'] === 'add_game') {
            $id = trim($_POST['id']);
            if (empty($id)) $id = 'g_' . uniqid();
            
            $catTitle = trim($_POST['category']);
            if (empty($catTitle)) $catTitle = 'Arcade';
            
            // Auto-create category with dynamic color/icon
            $catId = strtolower(str_replace(' ', '_', $catTitle));
            
            // Assign specific icons/colors to known categories, otherwise random
            $icon = 'game-controller-outline';
            $color = '#E94560';
            $tL = strtolower($catTitle);
            
            if (strpos($tL, 'action') !== false) { $icon = 'flash-outline'; $color = '#ef4444'; }
            elseif (strpos($tL, 'puzzle') !== false) { $icon = 'extension-puzzle-outline'; $color = '#3b82f6'; }
            elseif (strpos($tL, 'racing') !== false || strpos($tL, 'car') !== false) { $icon = 'car-sport-outline'; $color = '#f59e0b'; }
            elseif (strpos($tL, 'sport') !== false) { $icon = 'football-outline'; $color = '#10b981'; }
            elseif (strpos($tL, 'shoot') !== false) { $icon = 'crosshairs'; $color = '#6366f1'; }
            elseif (strpos($tL, 'girl') !== false || strpos($tL, 'dress') !== false) { $icon = 'woman-outline'; $color = '#ec4899'; }
            elseif (strpos($tL, 'multiplayer') !== false || strpos($tL, 'io') !== false) { $icon = 'people-outline'; $color = '#8b5cf6'; }
            elseif (strpos($tL, 'card') !== false || strpos($tL, 'board') !== false) { $icon = 'albums-outline'; $color = '#14b8a6'; }
            else {
                // Generate a random nice hex color for unknown categories based on string hash
                $hash = md5($catTitle);
                $color = '#' . substr($hash, 0, 6);
            }
            
            $stmtCat = $pdo->prepare("INSERT IGNORE INTO categories (id, title, icon, themeColor) VALUES (?, ?, ?, ?)");
            try { $stmtCat->execute([$catId, $catTitle, $icon, $color]); } catch(Exception $e) {}
            
            $stmt = $pdo->prepare("INSERT INTO games (id, title, description, iconUrl, gameUrl, category, tags, isActive, isFeatured, isPopular, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                trim($_POST['title']),
                trim($_POST['description']),
                trim($_POST['iconUrl']),
                trim($_POST['gameUrl']),
                trim($_POST['category']),
                trim($_POST['tags']),
                isset($_POST['isActive']) ? 1 : 0,
                isset($_POST['isFeatured']) ? 1 : 0,
                isset($_POST['isPopular']) ? 1 : 0,
                trim($_POST['rating']) ?: '4.5'
            ]);
            $message = "Game added successfully!";
        } 
        elseif ($_POST['action'] === 'edit_game') {
            $id = trim($_POST['id']);
            $stmt = $pdo->prepare("UPDATE games SET title=?, description=?, iconUrl=?, gameUrl=?, category=?, tags=?, isActive=?, isFeatured=?, isPopular=?, rating=? WHERE id=?");
            $stmt->execute([
                trim($_POST['title']),
                trim($_POST['description']),
                trim($_POST['iconUrl']),
                trim($_POST['gameUrl']),
                trim($_POST['category']),
                trim($_POST['tags']),
                isset($_POST['isActive']) ? 1 : 0,
                isset($_POST['isFeatured']) ? 1 : 0,
                isset($_POST['isPopular']) ? 1 : 0,
                trim($_POST['rating']) ?: '4.5',
                $id
            ]);
            $message = "Game updated successfully!";
        }
        elseif ($_POST['action'] === 'delete_game') {
            $id = $_POST['id'];
            $stmt = $pdo->prepare("DELETE FROM games WHERE id=?");
            $stmt->execute([$id]);
            $message = "Game deleted successfully!";
        }
        elseif ($_POST['action'] === 'add_category') {
            $id = trim($_POST['id']);
            if (empty($id)) $id = strtolower(str_replace(' ', '_', trim($_POST['title'])));
            
            $stmt = $pdo->prepare("INSERT INTO categories (id, title, icon, themeColor) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $id,
                trim($_POST['title']),
                trim($_POST['icon']) ?: 'game-controller-outline',
                trim($_POST['themeColor']) ?: '#E94560'
            ]);
            $message = "Category added successfully!";
        }
        elseif ($_POST['action'] === 'delete_category') {
            $id = $_POST['id'];
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id=?");
            $stmt->execute([$id]);
            $message = "Category deleted successfully!";
        }
        elseif ($_POST['action'] === 'sync_rss') {
            $feedUrl = trim($_POST['feedUrl']);
            
            // Fetch Feed
            $ch = curl_init($feedUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            $json = curl_exec($ch);
            curl_close($ch);
            
            $data = json_decode($json, true);
            $items = [];
            if (is_array($data)) {
                if (isset($data['items'])) $items = $data['items'];
                elseif (isset($data['data'])) $items = $data['data'];
                else $items = $data;
            }
            
            $addedCount = 0;
            $skippedCount = 0;
            
            $stmtGame = $pdo->prepare("INSERT IGNORE INTO games (id, title, description, iconUrl, gameUrl, category, tags, isActive, isFeatured, isPopular, rating) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0, '4.5')");
            $stmtCat = $pdo->prepare("INSERT IGNORE INTO categories (id, title, icon, themeColor) VALUES (?, ?, 'game-controller-outline', '#E94560')");
            
            foreach ($items as $item) {
                if (!is_array($item)) continue;

                $rawId = $item['id'] ?? $item['Id'] ?? $item['Asset'] ?? $item['gid'] ?? '';
                $title = strip_tags(trim($item['title'] ?? $item['Title'] ?? $item['name'] ?? ''));
                $url = $item['url'] ?? $item['Url'] ?? $item['gameUrl'] ?? $item['link'] ?? '';
                
                if (empty($rawId) || empty($title) || empty($url)) {
                    $skippedCount++;
                    continue;
                }
                
                // Safety check
                $safe = true;
                $searchText = strtolower($title . ' ' . ($item['category'] ?? '') . ' ' . ($item['description'] ?? ''));
                foreach ($blocklist as $term) {
                    if (strpos($searchText, $term) !== false) {
                        $safe = false;
                        break;
                    }
                }
                if (!$safe) {
                    $skippedCount++;
                    continue;
                }
                
                $thumb = $item['thumb2'] ?? $item['thumb'] ?? $item['image'] ?? $item['thumbnail'] ?? $item['icon'] ?? $item['ThumbnailUrl'] ?? '';
                $catRaw = trim($item['category'] ?? $item['Category'] ?? $item['genre'] ?? $item['Genre'] ?? 'Arcade');
                
                // Format category correctly
                $catWords = explode(' ', str_replace(['-', '_'], ' ', $catRaw));
                $catTitle = implode(' ', array_map('ucfirst', array_map('strtolower', $catWords)));
                if (empty($catTitle)) $catTitle = 'Arcade';
                
                $catId = strtolower(str_replace(' ', '_', $catTitle));
                
                // Auto create category if it doesn't exist
                try { $stmtCat->execute([$catId, $catTitle]); } catch(Exception $e) {}
                
                $tags = $item['tags'] ?? $item['Tags'] ?? [];
                if (is_array($tags)) $tagsStr = implode(', ', $tags);
                else $tagsStr = (string)$tags;
                
                $desc = strip_tags(trim($item['description'] ?? $item['Description'] ?? $item['instructions'] ?? ''));
                
                try {
                    $stmtGame->execute([
                        'g_' . $rawId,
                        $title,
                        $desc,
                        $thumb,
                        $url,
                        $catTitle,
                        $tagsStr
                    ]);
                    if ($stmtGame->rowCount() > 0) $addedCount++;
                    else $skippedCount++;
                } catch(Exception $e) {
                    $skippedCount++;
                }
            }
            
            $message = "RSS Sync Complete! Added $addedCount new games. Skipped $skippedCount games.";
        }
        elseif ($_POST['action'] === 'sync_html5games') {
            // Disabled in favor of the new JS-driven Smart Scraper below!
            $message = "Please use the JS-driven Smart Scraper modal.";
        }
    } catch (PDOException $e) {
        $message = "Database Error: " . $e->getMessage();
    }
}

// Pagination Logic
$page = isset($_GET['page']) && (int)$_GET['page'] > 0 ? (int)$_GET['page'] : 1;
$limit = 100;
$offset = ($page - 1) * $limit;
$totalGames = $pdo->query("SELECT COUNT(*) FROM games")->fetchColumn();
$totalPages = ceil($totalGames / $limit);

// Fetch current state from MySQL with Pagination
$games = $pdo->query("SELECT * FROM games ORDER BY created_at DESC LIMIT $limit OFFSET $offset")->fetchAll();
$categories = $pdo->query("SELECT * FROM categories")->fetchAll();

// Fetch Firebase Data for support tickets
$submissions = getCollection('game_submissions');
$issues = getCollection('issue_reports');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Game Arcade Admin</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; background: #f5f7fa; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; overflow-x: auto; }
        h1, h2, h3 { color: #E94560; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; min-width: 800px; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; background: #eee; }
        .badge.success { background: #d4edda; color: #155724; }
        .badge.warning { background: #fff3cd; color: #856404; }
        .badge.danger { background: #f8d7da; color: #721c24; }
        a, .link-btn { color: #E94560; text-decoration: none; cursor: pointer; border: none; background: none; font-size: 14px; padding: 0; }
        a:hover, .link-btn:hover { text-decoration: underline; }
        .btn { background: #E94560; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .btn:hover { background: #d13d56; }
        .btn-success { background: #28a745; }
        .btn-success:hover { background: #218838; }
        .btn-warning { background: #ffc107; color: #333; }
        .btn-warning:hover { background: #e0a800; }
        .btn-danger { background: #dc3545; }
        .btn-danger:hover { background: #c82333; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 14px; }
        .form-control { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .alert { padding: 10px; background: #d4edda; color: #155724; border-radius: 4px; margin-bottom: 20px; }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; }
        .modal.active { display: flex; }
        .modal-content { background: white; padding: 20px; border-radius: 8px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
        .close-btn { float: right; font-size: 24px; font-weight: bold; cursor: pointer; border: none; background: none; }
    </style>
</head>
<body>

    <div class="header">
        <h1>🎮 Game Arcade Admin (MySQL)</h1>
        <div>
            <button class="btn btn-warning" onclick="document.getElementById('scrapeModal').classList.add('active');" style="margin-right: 10px;">🕷️ Smart Scraper</button>
            <button class="btn btn-success" onclick="document.getElementById('syncModal').classList.add('active');" style="margin-right: 10px;">⚡ Auto-Sync RSS</button>
            <button class="btn" onclick="openGameModal()">+ Add Game</button>
            <a href="?logout=1" class="btn btn-danger" style="margin-left: 10px;">Logout</a>
        </div>
    </div>

    <?php if ($message): ?>
        <div class="alert"><?php echo htmlspecialchars($message); ?></div>
    <?php endif; ?>

    <div class="card">
        <h2>🕹️ Native Game Catalog (Total: <?php echo $totalGames; ?>)</h2>
        <p style="font-size: 14px; color: #666;">Showing page <?php echo $page; ?> of <?php echo $totalPages; ?> (100 games per page).</p>
        <table>
            <thead>
                <tr>
                    <th>Icon</th>
                    <th>Title & ID</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Tags</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($games as $index => $g): ?>
                <tr>
                    <td><img src="<?php echo htmlspecialchars($g['iconUrl'] ?? ''); ?>" style="width: 40px; height: 40px; border-radius: 8px; background: #eee;"></td>
                    <td><strong><?php echo htmlspecialchars($g['title'] ?? ''); ?></strong><br><small style="color: #888;"><?php echo htmlspecialchars($g['id'] ?? ''); ?></small></td>
                    <td><?php echo htmlspecialchars($g['category'] ?? ''); ?></td>
                    <td>
                        <?php if(!empty($g['isActive'])): ?><span class="badge success">Active</span><?php else: ?><span class="badge danger">Inactive</span><?php endif; ?>
                        <?php if(!empty($g['isFeatured'])): ?><span class="badge warning">⭐ Featured</span><?php endif; ?>
                    </td>
                    <td><?php echo htmlspecialchars($g['tags'] ?? ''); ?></td>
                    <td>
                        <button class="link-btn" onclick='editGame(<?php echo json_encode($g); ?>)'>Edit</button> |
                        <form method="POST" style="display:inline;" onsubmit="return confirm('Delete this game?');">
                            <input type="hidden" name="action" value="delete_game">
                            <input type="hidden" name="id" value="<?php echo htmlspecialchars($g['id']); ?>">
                            <button type="submit" class="link-btn" style="color: #dc3545;">Delete</button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if(empty($games)): ?>
                <tr><td colspan="6">No games added yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
        <div style="margin-top: 15px; display: flex; justify-content: space-between;">
            <?php if ($page > 1): ?>
                <a href="?page=<?php echo $page - 1; ?>" class="btn">⬅️ Previous Page</a>
            <?php else: ?>
                <span></span>
            <?php endif; ?>
            
            <?php if ($page < $totalPages): ?>
                <a href="?page=<?php echo $page + 1; ?>" class="btn">Next Page ➡️</a>
            <?php endif; ?>
        </div>
    </div>

    <div class="card">
        <h2>📁 Categories (<?php echo count($categories); ?>)</h2>
        <form method="POST" style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
            <input type="hidden" name="action" value="add_category">
            <div class="grid-2">
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" name="title" class="form-control" required placeholder="e.g. Action">
                </div>
                <div class="form-group">
                    <label>ID (Optional)</label>
                    <input type="text" name="id" class="form-control" placeholder="auto-generated if blank">
                </div>
                <div class="form-group">
                    <label>Ionicons Icon Name</label>
                    <input type="text" name="icon" class="form-control" value="game-controller-outline">
                </div>
                <div class="form-group">
                    <label>Theme Color (Hex)</label>
                    <input type="text" name="themeColor" class="form-control" value="#E94560">
                </div>
            </div>
            <button type="submit" class="btn">+ Add Category</button>
        </form>

        <table>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>ID</th>
                    <th>Icon</th>
                    <th>Color</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($categories as $c): ?>
                <tr>
                    <td><strong><?php echo htmlspecialchars($c['title'] ?? ''); ?></strong></td>
                    <td><?php echo htmlspecialchars($c['id'] ?? ''); ?></td>
                    <td><code><?php echo htmlspecialchars($c['icon'] ?? ''); ?></code></td>
                    <td><span style="display:inline-block; width:15px; height:15px; background:<?php echo htmlspecialchars($c['themeColor'] ?? '#E94560'); ?>; border-radius:3px; vertical-align:middle;"></span> <?php echo htmlspecialchars($c['themeColor'] ?? ''); ?></td>
                    <td>
                        <form method="POST" style="display:inline;" onsubmit="return confirm('Delete this category?');">
                            <input type="hidden" name="action" value="delete_category">
                            <input type="hidden" name="id" value="<?php echo htmlspecialchars($c['id']); ?>">
                            <button type="submit" class="link-btn" style="color: #dc3545;">Delete</button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <!-- Firebase Support Tickets (Read-only) -->
    <div class="card">
        <h2>📥 Firebase Game Submissions (<?php echo count($submissions); ?>)</h2>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Game Title</th>
                    <th>URL</th>
                    <th>Category</th>
                    <th>Submitter</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach(array_reverse($submissions) as $sub): ?>
                <tr>
                    <td><?php echo isset($sub['createdAt']) ? substr($sub['createdAt'], 0, 10) : 'N/A'; ?></td>
                    <td><strong><?php echo htmlspecialchars($sub['title'] ?? ''); ?></strong></td>
                    <td><a href="<?php echo htmlspecialchars($sub['gameUrl'] ?? '#'); ?>" target="_blank">Play Link</a></td>
                    <td><?php echo htmlspecialchars($sub['category'] ?? ''); ?></td>
                    <td><?php echo htmlspecialchars($sub['ownerName'] ?? ''); ?><br><small><?php echo htmlspecialchars($sub['ownerEmail'] ?? ''); ?></small></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <!-- RSS Sync Modal -->
    <div id="syncModal" class="modal">
        <div class="modal-content">
            <button class="close-btn" onclick="document.getElementById('syncModal').classList.remove('active');">&times;</button>
            <h2>⚡ RSS Auto-Sync</h2>
            <p>Paste your GameDistribution or JSON feed URL here. The server will download the games and insert them into MySQL.</p>
            <form method="POST">
                <input type="hidden" name="action" value="sync_rss">
                <div class="form-group">
                    <label>JSON Feed URL *</label>
                    <input type="url" name="feedUrl" class="form-control" required placeholder="https://catalog.gamedistribution.com/api/v2.0/rss/All/">
                </div>
                <button type="submit" class="btn btn-success" style="width: 100%; margin-top: 10px;" onclick="this.innerHTML='Syncing... Please wait.';">Start Sync</button>
            </form>
        </div>
    </div>

    <!-- Smart Bulk Scraper Modal -->
    <div id="scrapeModal" class="modal">
        <div class="modal-content">
            <button class="close-btn" onclick="document.getElementById('scrapeModal').classList.remove('active');">&times;</button>
            <h2>🕷️ Smart Bulk Scraper</h2>
            <p>Paste a list page (e.g. <code>https://html5games.com/All-Games</code>) to extract all individual game links, visit each one, and scrape accurate metadata.</p>
            <div class="form-group">
                <label>List Page URL *</label>
                <input type="url" id="bulkScrapeUrl" class="form-control" value="https://html5games.com/All-Games">
            </div>
            <button type="button" id="startBulkScrapeBtn" class="btn btn-warning" style="width: 100%; margin-top: 10px;" onclick="startBulkScrape()">Start Bulk Scrape</button>
            
            <div id="bulkScrapeProgress" style="display:none; margin-top: 20px;">
                <p style="font-weight:bold;" id="bulkScrapeStatus">Fetching list page...</p>
                <div style="background:#ddd; width:100%; height:20px; border-radius:10px; overflow:hidden;">
                    <div id="bulkScrapeBar" style="background:#28a745; width:0%; height:100%; transition: width 0.3s;"></div>
                </div>
                <div id="bulkScrapeLog" style="margin-top:10px; font-size:12px; height:150px; overflow-y:scroll; background:#333; color:#0f0; padding:10px; font-family:monospace;"></div>
            </div>
        </div>
    </div>

    <!-- Game Editor Modal -->
    <div id="gameModal" class="modal">
        <div class="modal-content">
            <button class="close-btn" onclick="closeGameModal()">&times;</button>
            <h2 id="modalTitle">Add New Game</h2>
            <form method="POST" id="gameForm">
                <input type="hidden" name="action" id="formAction" value="add_game">
                <input type="hidden" name="id" id="gameId" value="">
                
                <div class="form-group" style="background: #e3f2fd; padding: 15px; border-radius: 4px; border: 1px solid #bbdefb; margin-bottom: 20px;">
                    <label style="color: #0d47a1;">✨ Magic Auto-Fill</label>
                    <p style="font-size: 12px; color: #1565c0; margin: 0 0 10px 0;">Paste any game URL and we will attempt to scrape all details.</p>
                    <div style="display: flex; gap: 10px;">
                        <input type="url" id="magicScrapeUrl" class="form-control" placeholder="https://html5games.com/Game/...">
                        <button type="button" class="btn btn-primary" onclick="magicScrapeSingle()" id="magicScrapeBtn" style="white-space: nowrap;">Auto-Fill</button>
                    </div>
                </div>

                <div class="form-group">
                    <label>Game Title *</label>
                    <input type="text" name="title" id="gameTitle" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label>Game URL (HTML5 link) *</label>
                    <input type="url" name="gameUrl" id="gameUrl" class="form-control" required>
                </div>

                <div class="grid-2">
                    <div class="form-group">
                        <label>Icon/Thumbnail URL *</label>
                        <input type="url" name="iconUrl" id="gameIcon" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select name="category" id="gameCategory" class="form-control" required>
                            <?php foreach($categories as $c): ?>
                                <option value="<?php echo htmlspecialchars($c['title']); ?>"><?php echo htmlspecialchars($c['title']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" id="gameDesc" class="form-control" rows="3"></textarea>
                </div>

                <div class="grid-2">
                    <div class="form-group">
                        <label>Tags (comma separated)</label>
                        <input type="text" name="tags" id="gameTags" class="form-control" placeholder="Action, Runner, 3D">
                    </div>
                    <div class="form-group">
                        <label>Rating (e.g. 4.5)</label>
                        <input type="text" name="rating" id="gameRating" class="form-control" value="4.5">
                    </div>
                </div>

                <div class="form-group" style="background: #f8f9fa; padding: 10px; border-radius: 4px;">
                    <label style="display: inline-block; margin-right: 15px;">
                        <input type="checkbox" name="isActive" id="gameActive" checked> Active (Visible)
                    </label>
                    <label style="display: inline-block; margin-right: 15px;">
                        <input type="checkbox" name="isFeatured" id="gameFeatured"> Featured
                    </label>
                    <label style="display: inline-block;">
                        <input type="checkbox" name="isPopular" id="gamePopular"> Popular
                    </label>
                </div>

                <button type="submit" class="btn" style="width: 100%; margin-top: 10px;">Save Game</button>
            </form>
        </div>
    </div>

    <script>
        // --- Modal Logic ---
        function openGameModal() {
            document.getElementById('modalTitle').innerText = 'Add New Game';
            document.getElementById('formAction').value = 'add_game';
            document.getElementById('gameForm').reset();
            document.getElementById('gameId').value = '';
            document.getElementById('gameModal').classList.add('active');
        }

        function closeGameModal() {
            document.getElementById('gameModal').classList.remove('active');
        }

        function editGame(game) {
            document.getElementById('modalTitle').innerText = 'Edit Game';
            document.getElementById('formAction').value = 'edit_game';
            
            document.getElementById('gameId').value = game.id || '';
            document.getElementById('gameTitle').value = game.title || '';
            document.getElementById('gameUrl').value = game.gameUrl || '';
            document.getElementById('gameIcon').value = game.iconUrl || '';
            document.getElementById('gameDesc').value = game.description || '';
            document.getElementById('gameCategory').value = game.category || '';
            document.getElementById('gameTags').value = game.tags || '';
            document.getElementById('gameRating').value = game.rating || '4.5';
            
            document.getElementById('gameActive').checked = !!parseInt(game.isActive);
            document.getElementById('gameFeatured').checked = !!parseInt(game.isFeatured);
            document.getElementById('gamePopular').checked = !!parseInt(game.isPopular);

            document.getElementById('gameModal').classList.add('active');
        }

        // --- Core Scraper Engine ---
        async function fetchHtmlViaProxy(url) {
            const formData = new URLSearchParams();
            formData.append('action', 'proxy_fetch');
            formData.append('url', url);
            
            const res = await fetch('admin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            return data.html;
        }

        function extractGameDetailsFromHtml(html, sourceUrl) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            let title = '';
            let description = '';
            let iconUrl = '';
            let gameUrl = '';
            let category = 'Arcade';
            let tags = '';
            
            // OpenGraph fallback
            const ogTitle = doc.querySelector('meta[property="og:title"]');
            const ogDesc = doc.querySelector('meta[property="og:description"]');
            const ogImage = doc.querySelector('meta[property="og:image"]');
            
            if (ogTitle) title = ogTitle.getAttribute('content');
            else {
                const t = doc.querySelector('title');
                if (t) title = t.innerText.split('-')[0].trim();
            }
            
            if (ogDesc) description = ogDesc.getAttribute('content');
            else {
                const m = doc.querySelector('meta[name="description"]');
                if (m) description = m.getAttribute('content');
            }
            
            if (ogImage) iconUrl = ogImage.getAttribute('content');

            // html5games.com specific extraction
            if (sourceUrl.includes('html5games.com')) {
                const affLink = doc.querySelector('textarea.aff-iliate-link');
                if (affLink) gameUrl = affLink.value.trim();
                
                const catElement = doc.querySelector('.game-categories ul li a');
                if (catElement) category = catElement.innerText.trim();
                
                // HTML5games often has higher res images
                const imgNode = doc.querySelector('figure a[href*="180"] img') || doc.querySelector('figure a[href*="120"] img');
                if (imgNode) iconUrl = imgNode.src;
            } else {
                // Generic fallback for gameURL (look for first iframe or generic regex)
                const iframe = doc.querySelector('iframe');
                if (iframe) gameUrl = iframe.src;
            }

            return { title, description, iconUrl, gameUrl, category, tags };
        }

        // --- 1. Single URL Magic Auto-Fill ---
        async function magicScrapeSingle() {
            const url = document.getElementById('magicScrapeUrl').value.trim();
            if (!url) return alert('Paste a URL first!');
            
            const btn = document.getElementById('magicScrapeBtn');
            btn.innerText = 'Scraping...';
            btn.disabled = true;
            
            try {
                const html = await fetchHtmlViaProxy(url);
                const data = extractGameDetailsFromHtml(html, url);
                
                if (data.title) document.getElementById('gameTitle').value = data.title;
                if (data.description) document.getElementById('gameDesc').value = data.description;
                if (data.iconUrl) document.getElementById('gameIcon').value = data.iconUrl;
                if (data.gameUrl) document.getElementById('gameUrl').value = data.gameUrl;
                if (data.tags) document.getElementById('gameTags').value = data.tags;
                
                // Set category dropdown if exists
                if (data.category) {
                    const sel = document.getElementById('gameCategory');
                    let found = false;
                    for (let i = 0; i < sel.options.length; i++) {
                        if (sel.options[i].text.toLowerCase().includes(data.category.toLowerCase())) {
                            sel.selectedIndex = i;
                            found = true;
                            break;
                        }
                    }
                    if (!found) alert("Warning: Category '" + data.category + "' was found but does not exist in your database. Please create it first, or choose another.");
                }
            } catch (e) {
                alert('Scrape failed: ' + e.message);
            }
            btn.innerText = 'Auto-Fill';
            btn.disabled = false;
        }

        // --- 2. Smart Bulk Scraper (No Timeout) ---
        function appendLog(msg) {
            const log = document.getElementById('bulkScrapeLog');
            log.innerHTML += `<div>${msg}</div>`;
            log.scrollTop = log.scrollHeight;
        }

        async function startBulkScrape() {
            const listUrl = document.getElementById('bulkScrapeUrl').value.trim();
            if (!listUrl) return alert('Enter a list URL!');
            
            document.getElementById('startBulkScrapeBtn').style.display = 'none';
            document.getElementById('bulkScrapeProgress').style.display = 'block';
            
            appendLog(`Fetching list page: ${listUrl}...`);
            
            try {
                const listHtml = await fetchHtmlViaProxy(listUrl);
                const parser = new DOMParser();
                const doc = parser.parseFromString(listHtml, 'text/html');
                
                // Extract game links specifically for html5games.com
                // Adjust this selector if using a different site
                const linkNodes = doc.querySelectorAll('a[href^="/Game/"]');
                const gameUrls = [];
                linkNodes.forEach(n => {
                    const fullUrl = new URL(n.getAttribute('href'), 'https://html5games.com').href;
                    if (!gameUrls.includes(fullUrl)) gameUrls.push(fullUrl);
                });
                
                if (gameUrls.length === 0) {
                    return appendLog('No game URLs found on that page. Is it html5games.com?');
                }
                
                appendLog(`Found ${gameUrls.length} games! Starting deep extraction...`);
                
                let successCount = 0;
                for (let i = 0; i < gameUrls.length; i++) {
                    const url = gameUrls[i];
                    document.getElementById('bulkScrapeStatus').innerText = `Scraping ${i+1} of ${gameUrls.length}: ${url}`;
                    document.getElementById('bulkScrapeBar').style.width = `${((i+1)/gameUrls.length)*100}%`;
                    
                    try {
                        const html = await fetchHtmlViaProxy(url);
                        const data = extractGameDetailsFromHtml(html, url);
                        
                        if (!data.title || !data.gameUrl) {
                            appendLog(`Skipped (missing vital data): ${url}`);
                            continue;
                        }
                        
                        // Submit to database via AJAX POST
                        const formData = new URLSearchParams();
                        formData.append('action', 'add_game');
                        // Use a generated slug for ID
                        formData.append('id', 'h5g_' + data.title.toLowerCase().replace(/[^a-z0-9]/g, ''));
                        formData.append('title', data.title);
                        formData.append('description', data.description);
                        formData.append('iconUrl', data.iconUrl);
                        formData.append('gameUrl', data.gameUrl);
                        formData.append('category', data.category);
                        formData.append('tags', data.tags);
                        formData.append('isActive', '1');
                        formData.append('rating', '4.5');
                        
                        await fetch('admin.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: formData.toString()
                        });
                        
                        appendLog(`✅ Saved: ${data.title}`);
                        successCount++;
                    } catch(err) {
                        appendLog(`❌ Failed to fetch/parse: ${url} (${err.message})`);
                    }
                    
                    // Small delay to prevent rate-limiting
                    await new Promise(r => setTimeout(r, 500));
                }
                
                document.getElementById('bulkScrapeStatus').innerText = `Complete! Added ${successCount} new games.`;
                appendLog('Done! Please refresh the page to see your new games.');
            } catch (e) {
                appendLog(`Fatal error: ${e.message}`);
            }
        }
    </script>
</body>
</html>
