<?php
declare(strict_types=1);
defined('HVM_APP') || exit;

/** All SQL for the diagnostic_sessions table. Values are always bound as parameters. */

const HVM_SESSION_COLUMNS = [
    'id', 'language', 'conference_mode', 'completed_at', 'answers', 'business_type', 'monthly_contacts',
    'biggest_challenge', 'automation_score', 'human_value_score', 'cx_maturity_score', 'automation_level',
    'human_value_level', 'cx_maturity_level', 'biggest_opportunity', 'scoring_version',
];

const HVM_LEAD_COLUMNS = [
    'first_name', 'last_name', 'company', 'email', 'website', 'phone', 'lead_submitted_at',
    'consent_given', 'consent_at', 'consent_version', 'consent_text',
];

function hvm_placeholders(int $n): string
{
    return implode(', ', array_fill(0, $n, '?'));
}

function hvm_values(array $row, array $columns): array
{
    return array_map(function (string $c) use ($row) {
        return $row[$c];
    }, $columns);
}

/** Stores a completed test. A repeated call for the same session changes nothing. */
function hvm_insert_completed_test(PDO $db, array $row): void
{
    $sql = 'INSERT INTO diagnostic_sessions (' . implode(', ', HVM_SESSION_COLUMNS) . ') VALUES ('
        . hvm_placeholders(count(HVM_SESSION_COLUMNS)) . ') ON DUPLICATE KEY UPDATE id = id';
    $db->prepare($sql)->execute(hvm_values($row, HVM_SESSION_COLUMNS));
}

/**
 * Adds contact details + consent to a session, or inserts the whole row if the
 * completed-test call never arrived. One statement; the original test data and
 * completion time are never overwritten.
 */
function hvm_upsert_lead(PDO $db, array $row, array $lead): void
{
    $columns = array_merge(HVM_SESSION_COLUMNS, HVM_LEAD_COLUMNS);
    $updates = implode(', ', array_map(function (string $c) {
        return $c . ' = VALUES(' . $c . ')';
    }, HVM_LEAD_COLUMNS));
    $sql = 'INSERT INTO diagnostic_sessions (' . implode(', ', $columns) . ') VALUES ('
        . hvm_placeholders(count($columns)) . ') ON DUPLICATE KEY UPDATE ' . $updates;
    $db->prepare($sql)->execute(array_merge(hvm_values($row, HVM_SESSION_COLUMNS), hvm_values($lead, HVM_LEAD_COLUMNS)));
}

function hvm_iso($value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    $dt = DateTimeImmutable::createFromFormat('Y-m-d H:i:s.u', (string) $value, new DateTimeZone('UTC'))
        ?: DateTimeImmutable::createFromFormat('Y-m-d H:i:s', (string) $value, new DateTimeZone('UTC'));
    return $dt ? $dt->format('Y-m-d\TH:i:s.v\Z') : null;
}

/** All sessions for the admin dashboard, newest first. */
function hvm_list_sessions(PDO $db): array
{
    $columns = implode(', ', array_merge(HVM_SESSION_COLUMNS, HVM_LEAD_COLUMNS));
    $stmt = $db->query("SELECT $columns FROM diagnostic_sessions ORDER BY completed_at DESC, id LIMIT 50000");
    $rows = [];
    foreach ($stmt as $r) {
        $answers = json_decode((string) $r['answers'], true);
        $rows[] = [
            'id' => $r['id'],
            'language' => $r['language'],
            'conference_mode' => (bool) $r['conference_mode'],
            'completed_at' => hvm_iso($r['completed_at']),
            'answers' => is_array($answers) && $answers !== [] ? $answers : new stdClass(),
            'biggest_challenge' => $r['biggest_challenge'],
            'automation_score' => (int) $r['automation_score'],
            'human_value_score' => (int) $r['human_value_score'],
            'cx_maturity_score' => (int) $r['cx_maturity_score'],
            'automation_level' => $r['automation_level'],
            'human_value_level' => $r['human_value_level'],
            'cx_maturity_level' => $r['cx_maturity_level'],
            'biggest_opportunity' => $r['biggest_opportunity'],
            'scoring_version' => $r['scoring_version'],
            'first_name' => $r['first_name'],
            'last_name' => $r['last_name'],
            'company' => $r['company'],
            'email' => $r['email'],
            'website' => $r['website'],
            'phone' => $r['phone'],
            'lead_submitted_at' => hvm_iso($r['lead_submitted_at']),
            'consent_given' => (bool) $r['consent_given'],
            'consent_at' => hvm_iso($r['consent_at']),
            'consent_version' => $r['consent_version'],
            'consent_text' => $r['consent_text'],
        ];
    }
    return $rows;
}

function hvm_ping_table(PDO $db): void
{
    $db->query('SELECT 1 FROM diagnostic_sessions LIMIT 1')->fetchAll();
}
