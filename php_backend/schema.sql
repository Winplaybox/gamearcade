-- Run this in your phpMyAdmin SQL tab to create the necessary tables for User Data

CREATE TABLE IF NOT EXISTS `categories` (
  `id` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `themeColor` varchar(50) DEFAULT '#E94560',
  `orderIndex` int(11) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `games` (
  `id` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(100) NOT NULL,
  `iconUrl` varchar(500) NOT NULL,
  `gameUrl` varchar(500) NOT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `isFeatured` tinyint(1) DEFAULT '0',
  `isPopular` tinyint(1) DEFAULT '0',
  `rating` decimal(3,1) DEFAULT '5.0',
  `isActive` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `lastLoginAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `appLockEnabled` tinyint(1) DEFAULT '0',
  `hasRatedApp` tinyint(1) DEFAULT '0',
  `adsEnabled` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `favorites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(255) NOT NULL,
  `gameId` varchar(255) NOT NULL,
  `addedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_game` (`userId`,`gameId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(255) NOT NULL,
  `gameId` varchar(255) NOT NULL,
  `rating` decimal(3,1) NOT NULL,
  `reviewText` text,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_game_rating` (`userId`,`gameId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `recent_games` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(255) NOT NULL,
  `gameId` varchar(255) NOT NULL,
  `timestamp` bigint(20) NOT NULL,
  `durationMs` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_game_recent` (`userId`,`gameId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `game_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `ownerName` varchar(255) NOT NULL,
  `ownerEmail` varchar(255) NOT NULL,
  `gameUrl` varchar(500) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text,
  `status` varchar(50) DEFAULT 'pending',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `issue_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(255) DEFAULT NULL,
  `gameId` varchar(255) DEFAULT NULL,
  `gameTitle` varchar(255) DEFAULT NULL,
  `issueType` varchar(100) NOT NULL,
  `details` text,
  `status` varchar(50) DEFAULT 'open',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- MIGRATION: Add userId to existing tables
-- --------------------------------------------------------
-- Run these commands directly if your tables are already created:
-- ALTER TABLE `game_submissions` ADD COLUMN `userId` varchar(255) DEFAULT NULL AFTER `id`;
-- ALTER TABLE `issue_reports` ADD COLUMN `userId` varchar(255) DEFAULT NULL AFTER `id`;

CREATE TABLE IF NOT EXISTS `ad_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(255) NOT NULL,
  `adType` varchar(50) NOT NULL,
  `screen` varchar(100) DEFAULT NULL,
  `activity` varchar(255) DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

