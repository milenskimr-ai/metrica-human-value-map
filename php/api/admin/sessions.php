<?php
declare(strict_types=1);
/** GET /api/admin/sessions.php — all completed tests and leads for the dashboard (admin only). */
require dirname(__DIR__) . '/_lib/bootstrap.php';

hvm_require_method('GET');

if (!hvm_admin_configured()) {
    hvm_fail(503, 'admin_not_configured');
}
if (!hvm_is_admin()) {
    hvm_fail(401, 'unauthorized');
}
$db = hvm_db();
if ($db === null) {
    hvm_fail(503, 'not_configured');
}
try {
    $rows = hvm_list_sessions($db);
} catch (PDOException $e) {
    error_log('hvm admin: fetch failed: ' . $e->getMessage());
    hvm_fail(500, 'storage_error');
}
hvm_ok(['rows' => $rows]);
