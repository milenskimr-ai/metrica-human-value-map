<?php
declare(strict_types=1);
/** POST /api/complete.php — stores an anonymous completed test (no contact data). */
require __DIR__ . '/_lib/bootstrap.php';

hvm_require_method('POST');
hvm_require_same_origin();

$body = hvm_read_json();
if ($body === null) {
    hvm_fail(400, 'invalid_body');
}
$answers = hvm_parse_answers($body['answers'] ?? null);
if (!hvm_is_uuid($body['sessionId'] ?? null) || !hvm_is_lang($body['language'] ?? null) || $answers === null) {
    hvm_fail(400, 'invalid_input');
}

$row = hvm_session_row($body['sessionId'], $body['language'], ($body['conferenceMode'] ?? null) === true, $answers, hvm_now());
$db = hvm_db();
if ($db === null) {
    hvm_fail(503, 'storage_not_configured');
}
try {
    hvm_insert_completed_test($db, $row);
} catch (PDOException $e) {
    error_log('hvm complete: insert failed: ' . $e->getMessage());
    hvm_fail(500, 'storage_error');
}
hvm_ok();
