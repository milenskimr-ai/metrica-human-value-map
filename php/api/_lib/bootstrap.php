<?php
declare(strict_types=1);

/**
 * Loaded first by every endpoint. Plain PHP 7.4+, no dependencies.
 * Needs the pdo_mysql extension (standard on PHP-FPM hosts).
 */
if (!defined('HVM_APP')) {
    define('HVM_APP', true);
}

const HVM_MAX_BODY_BYTES = 10000;

ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once __DIR__ . '/http.php';
require_once __DIR__ . '/validation.php';
require_once __DIR__ . '/scoring.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/repo.php';
require_once __DIR__ . '/auth.php';

set_exception_handler(function (Throwable $e): void {
    error_log('hvm: ' . get_class($e) . ': ' . $e->getMessage());
    hvm_fail(500, 'server_error');
});

/** Settings from api/config.php (the only file edited on the server). */
function hvm_config(): array
{
    static $config = null;
    if ($config === null) {
        $file = dirname(__DIR__) . '/config.php';
        $loaded = is_file($file) ? require $file : [];
        $config = is_array($loaded) ? $loaded : [];
    }
    return $config;
}

/**
 * Questions, scoring weights, thresholds and consent texts.
 * Generated at build time from the same TypeScript config the browser uses (config/*.ts, locales/*.json),
 * so the server and the browser can never disagree on the scoring.
 */
function hvm_rules(): array
{
    static $rules = null;
    if ($rules === null) {
        $json = file_get_contents(__DIR__ . '/rules.json');
        $rules = json_decode($json === false ? '' : $json, true);
        if (!is_array($rules)) {
            throw new RuntimeException('rules.json is missing or invalid');
        }
    }
    return $rules;
}

/** Current UTC time as stored in DATETIME(3) columns. */
function hvm_now(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s.v');
}
