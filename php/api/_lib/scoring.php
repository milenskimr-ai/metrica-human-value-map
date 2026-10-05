<?php
declare(strict_types=1);
defined('HVM_APP') || exit;

/**
 * Server-side scoring — the same rules as lib/engine/*.ts in the browser, driven by rules.json.
 * Scores are always recomputed here; scores sent by the browser are never trusted.
 */

function hvm_sum_points(array $weights, array $answers): int
{
    $sum = 0;
    foreach ($weights as $questionId => $table) {
        foreach ($answers[$questionId] ?? [] as $answerId) {
            if (array_key_exists($answerId, $table)) {
                $sum += (int) $table[$answerId];
            }
        }
    }
    return $sum;
}

function hvm_level_for(int $score): string
{
    $t = hvm_rules()['levelThresholds'];
    if ($score >= $t['high']) {
        return 'high';
    }
    if ($score >= $t['medium']) {
        return 'medium';
    }
    return 'low';
}

/** @return array<string, array{score:int, level:string}> keyed by dimension */
function hvm_score_all(array $answers): array
{
    $out = [];
    foreach (hvm_rules()['dimensions'] as $dimension => $config) {
        $raw = $config['base'] + hvm_sum_points($config['weights'], $answers);
        $score = max(0, min(100, (int) floor($raw + 0.5))); // same rounding as JS Math.round
        $out[$dimension] = ['score' => $score, 'level' => hvm_level_for($score)];
    }
    return $out;
}

/** Highest-scoring category; ties go to the earlier category in tieBreakOrder. */
function hvm_biggest_opportunity(array $answers): string
{
    $rules = hvm_rules();
    $best = $rules['tieBreakOrder'][0];
    $bestPoints = null;
    foreach ($rules['tieBreakOrder'] as $category) {
        $points = hvm_sum_points($rules['opportunityWeights'][$category], $answers);
        if ($bestPoints === null || $points > $bestPoints) {
            $best = $category;
            $bestPoints = $points;
        }
    }
    return $best;
}

/** One diagnostic_sessions row (without lead fields). */
function hvm_session_row(string $id, string $language, bool $conferenceMode, array $answers, string $completedAt): array
{
    $d = hvm_score_all($answers);
    return [
        'id' => $id,
        'language' => $language,
        'conference_mode' => $conferenceMode ? 1 : 0,
        'completed_at' => $completedAt,
        'answers' => json_encode($answers, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'business_type' => $answers['business_type'][0] ?? null,
        'monthly_contacts' => $answers['monthly_contacts'][0] ?? null,
        'biggest_challenge' => $answers['biggest_challenge'][0] ?? null,
        'automation_score' => $d['automation']['score'],
        'human_value_score' => $d['human_value']['score'],
        'cx_maturity_score' => $d['cx_maturity']['score'],
        'automation_level' => $d['automation']['level'],
        'human_value_level' => $d['human_value']['level'],
        'cx_maturity_level' => $d['cx_maturity']['level'],
        'biggest_opportunity' => hvm_biggest_opportunity($answers),
        'scoring_version' => hvm_rules()['scoringVersion'],
    ];
}
