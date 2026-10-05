<?php
declare(strict_types=1);
/** POST /api/admin/login.php  {"password": "..."} — sets the signed admin cookie (12 hours). */
require dirname(__DIR__) . '/_lib/bootstrap.php';

hvm_require_method('POST');
hvm_require_same_origin();

if (!hvm_admin_configured()) {
    hvm_fail(503, 'not_configured');
}
$body = hvm_read_json();
$password = is_array($body) && is_string($body['password'] ?? null) ? $body['password'] : '';
if (!hvm_check_password($password)) {
    usleep(800000); // slows down password guessing
    hvm_fail(401, 'invalid');
}
hvm_start_admin_session();
hvm_ok();
