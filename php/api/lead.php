<?php
declare(strict_types=1);
/** POST /api/lead.php — attaches contact details + consent to a completed test. */
require __DIR__ . '/_lib/bootstrap.php';

hvm_require_method('POST');
hvm_require_same_origin();

$body = hvm_read_json();
if ($body === null) {
    hvm_fail(400, 'invalid_body');
}

// Honeypot: a hidden field real visitors never fill in. Pretend success for bots.
if (is_string($body['fax'] ?? null) && $body['fax'] !== '') {
    hvm_ok();
}

$answers = hvm_parse_answers($body['answers'] ?? null);
if (!hvm_is_uuid($body['sessionId'] ?? null) || !hvm_is_lang($body['language'] ?? null) || $answers === null) {
    hvm_fail(400, 'invalid_input');
}
if (($body['consent'] ?? null) !== true) {
    hvm_fail(400, 'consent_required');
}

$lead = [
    'first_name' => hvm_clean_text($body['firstName'] ?? null, 100),
    'last_name' => hvm_clean_text($body['lastName'] ?? null, 100),
    'company' => hvm_clean_text($body['company'] ?? null, 200),
    'email' => hvm_clean_email($body['email'] ?? null),
    'website' => hvm_clean_text($body['website'] ?? null, 300),
];
if (in_array(null, $lead, true)) {
    hvm_fail(400, 'invalid_input');
}
$phone = $body['phone'] ?? null;
$lead['phone'] = (is_string($phone) && $phone !== '') ? hvm_clean_text($phone, 40) : null;

$now = hvm_now();
$language = $body['language'];
$lead += [
    'lead_submitted_at' => $now,
    'consent_given' => 1,
    'consent_at' => $now,                                   // server time, not browser time
    'consent_version' => hvm_rules()['consentVersion'],
    'consent_text' => hvm_rules()['consentText'][$language], // exact wording shown, in the visitor's language
];

$row = hvm_session_row($body['sessionId'], $language, ($body['conferenceMode'] ?? null) === true, $answers, $now);
$db = hvm_db();
if ($db === null) {
    hvm_fail(503, 'storage_not_configured');
}
try {
    hvm_upsert_lead($db, $row, $lead);
} catch (PDOException $e) {
    error_log('hvm lead: save failed: ' . $e->getMessage());
    hvm_fail(500, 'storage_error');
}
hvm_ok();
