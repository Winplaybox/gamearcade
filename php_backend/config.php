<?php
/**
 * WinPlayBox Game Arcade - PHP Configuration
 */

// ============================================================================
// 1. MYSQL DATABASE CONFIGURATION (FOR GAMES & CATEGORIES)
// ============================================================================
// ⚠️ IMPORTANT: Fill these in with your Hostinger MySQL details!
define('DB_HOST', 'localhost');
define('DB_NAME', 'u313800784_gamearcade');
define('DB_USER', 'u313800784_gamearcade');
define('DB_PASS', ';I49Oopu9=kO');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    // Set PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Fetch data as associative arrays by default
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Fail silently so Firebase API doesn't crash if MySQL is misconfigured yet
    // echo "Connection failed: " . $e->getMessage();
    $pdo = null;
}


// ============================================================================
// 2. FIREBASE CONFIGURATION (FOR SUBMISSIONS & ISSUE REPORTS)
// ============================================================================
define('FIREBASE_PROJECT_ID', 'winplaybox-ce209');
define('FIRESTORE_BASE_URL', 'https://firestore.googleapis.com/v1/projects/' . FIREBASE_PROJECT_ID . '/databases/(default)/documents');

/**
 * Perform cURL Request to Firestore REST API
 */
function firestoreRequest($url, $method = 'GET', $payload = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    if ($payload) {
        $json = json_encode($payload);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'code' => $httpCode,
        'data' => json_decode($response, true)
    ];
}

/**
 * Parse a Firestore Document into a flat PHP Associative Array
 */
function parseFirestoreDoc($doc) {
    if (!$doc || !isset($doc['name'])) return null;
    $parts = explode('/', $doc['name']);
    $id = end($parts);
    $data = ['id' => $id];
    if (isset($doc['fields'])) {
        foreach ($doc['fields'] as $key => $val) {
            if (isset($val['stringValue'])) {
                $data[$key] = $val['stringValue'];
            } elseif (isset($val['integerValue'])) {
                $data[$key] = (int)$val['integerValue'];
            } elseif (isset($val['doubleValue'])) {
                $data[$key] = (float)$val['doubleValue'];
            } elseif (isset($val['booleanValue'])) {
                $data[$key] = (bool)$val['booleanValue'];
            } elseif (isset($val['arrayValue']['values'])) {
                $arr = [];
                foreach ($val['arrayValue']['values'] as $item) {
                    if (isset($item['integerValue'])) $arr[] = (int)$item['integerValue'];
                    elseif (isset($item['stringValue'])) $arr[] = $item['stringValue'];
                }
                $data[$key] = $arr;
            }
        }
    }
    return $data;
}

/**
 * Get all documents in a collection (Handles Pagination)
 */
function getCollection($collectionName) {
    $documents = [];
    $nextPageToken = null;
    
    do {
        $url = FIRESTORE_BASE_URL . '/' . $collectionName . '?pageSize=300';
        if ($nextPageToken) {
            $url .= '&pageToken=' . urlencode($nextPageToken);
        }
        
        $res = firestoreRequest($url, 'GET');
        
        if ($res['code'] === 200 && isset($res['data']['documents'])) {
            foreach ($res['data']['documents'] as $doc) {
                $parsed = parseFirestoreDoc($doc);
                if ($parsed) $documents[] = $parsed;
            }
            $nextPageToken = isset($res['data']['nextPageToken']) ? $res['data']['nextPageToken'] : null;
        } else {
            // Stop if there's an error (e.g. quota exceeded)
            break;
        }
    } while ($nextPageToken);
    
    return $documents;
}
