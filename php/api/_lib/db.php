<?php
declare(strict_types=1);
defined('HVM_APP') || exit;

function hvm_db_configured(): bool
{
    $c = hvm_config();
    return ($c['db_name'] ?? '') !== '' && ($c['db_user'] ?? '') !== '' && ($c['db_password'] ?? '') !== '';
}

/** Shared PDO connection (MariaDB / MySQL), or null when not configured. Throws PDOException on failure. */
function hvm_db(): ?PDO
{
    static $pdo = null;
    if (!hvm_db_configured()) {
        return null;
    }
    if ($pdo === null) {
        $c = hvm_config();
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $c['db_host'] ?? 'localhost',
            (int) ($c['db_port'] ?? 3306),
            $c['db_name']
        );
        $pdo = new PDO($dsn, (string) $c['db_user'], (string) $c['db_password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 5,
        ]);
        $pdo->exec("SET time_zone = '+00:00'"); // all timestamps are UTC
    }
    return $pdo;
}
