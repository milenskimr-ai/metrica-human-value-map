<?php
declare(strict_types=1);
defined('HVM_APP') || exit;

function hvm_is_uuid($value): bool
{
    return is_string($value)
        && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $value) === 1;
}

function hvm_is_lang($value): bool
{
    return $value === 'bg' || $value === 'en';
}

/**
 * Accepts only known question/answer IDs, a complete test, and valid selection counts.
 * Returns answers keyed by question ID (always lists of answer IDs), or null.
 */
function hvm_parse_answers($input): ?array
{
    if (!is_array($input)) {
        return null;
    }
    $out = [];
    foreach (hvm_rules()['questions'] as $q) {
        $value = $input[$q['id']] ?? null;
        if (!is_array($value) || $value === [] || array_keys($value) !== range(0, count($value) - 1)) {
            return null;
        }
        $ids = [];
        foreach ($value as $answer) {
            if (!is_string($answer) || !in_array($answer, $q['answers'], true)) {
                return null;
            }
            if (!in_array($answer, $ids, true)) {
                $ids[] = $answer;
            }
        }
        if ($q['type'] === 'single' && count($ids) !== 1) {
            return null;
        }
        if (isset($q['maxSelections']) && count($ids) > $q['maxSelections']) {
            return null;
        }
        $out[$q['id']] = $ids;
    }
    return $out;
}

function hvm_strlen(string $s): int
{
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : (int) preg_match_all('/./us', $s);
}

/** Trimmed, whitespace-collapsed text of 1..$max characters, or null. */
function hvm_clean_text($value, int $max = 200): ?string
{
    if (!is_string($value)) {
        return null;
    }
    $s = preg_replace('/\s+/u', ' ', trim($value));
    if (!is_string($s)) {
        return null; // invalid UTF-8
    }
    $s = trim($s);
    $len = hvm_strlen($s);
    return ($len > 0 && $len <= $max) ? $s : null;
}

function hvm_clean_email($value): ?string
{
    $s = hvm_clean_text($value, 254);
    if ($s === null) {
        return null;
    }
    $s = function_exists('mb_strtolower') ? mb_strtolower($s, 'UTF-8') : strtolower($s);
    return preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u', $s) === 1 ? $s : null;
}
