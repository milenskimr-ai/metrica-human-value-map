<?php
declare(strict_types=1);
/**
 * GET /api/health.php — pre-flight / uptime check.
 * Returns only yes/no flags, never data or secrets. HTTP 200 when OK, 503 otherwise.
 */
require __DIR__ . '/_lib/bootstrap.php';

hvm_require_method('GET');

$database = 'not_configured';
if (hvm_db_configured()) {
    try {
        hvm_ping_table(hvm_db());
        $database = 'ok';
    } catch (Throwable $e) {
        error_log('hvm health: database check failed: ' . $e->getMessage());
        $database = 'error';
    }
}
$admin = hvm_admin_configured() ? 'ok' : 'not_configured';
$ok = $database === 'ok' && $admin === 'ok';
$revision = @file_get_contents(__DIR__ . '/_lib/revision.txt');
hvm_send_json($ok ? 200 : 503, [
    'ok' => $ok,
    'database' => $database,
    'admin' => $admin,
    'revision' => $revision === false ? null : trim($revision),
]);
