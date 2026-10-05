<?php
declare(strict_types=1);
// Test helper: reads a JSON list of answer sets on stdin, prints the PHP scoring result for each.
require __DIR__ . '/../../php/api/_lib/bootstrap.php';
$sets = json_decode(stream_get_contents(STDIN), true);
$out = [];
foreach ($sets as $answers) {
    $parsed = hvm_parse_answers($answers);
    $out[] = $parsed === null ? null : ['dimensions' => hvm_score_all($parsed), 'opportunity' => hvm_biggest_opportunity($parsed)];
}
echo json_encode($out);
