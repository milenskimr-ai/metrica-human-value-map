<?php
declare(strict_types=1);
defined('HVM_APP') || exit;

function hvm_send_json(int $status, array $data): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hvm_ok(array $extra = []): void
{
    hvm_send_json(200, ['ok' => true] + $extra);
}

function hvm_fail(int $status, string $error): void
{
    hvm_send_json($status, ['ok' => false, 'error' => $error]);
}

function hvm_require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        header('Allow: ' . $method);
        hvm_fail(405, 'method_not_allowed');
    }
}

/** Rejects POSTs sent by other websites (the browser always sends Origin on cross-site POSTs). */
function hvm_require_same_origin(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin === '') {
        return;
    }
    $parts = parse_url($origin);
    $originHost = strtolower(($parts['host'] ?? '') . (isset($parts['port']) ? ':' . $parts['port'] : ''));
    $host = strtolower($_SERVER['HTTP_HOST'] ?? '');
    if ($originHost === '' || $originHost !== $host) {
        hvm_fail(403, 'cross_origin');
    }
}

/** Request body as a JSON object (associative array); null when missing, too large or not an object. */
function hvm_read_json(): ?array
{
    $raw = file_get_contents('php://input', false, null, 0, HVM_MAX_BODY_BYTES + 1);
    if ($raw === false || $raw === '' || strlen($raw) > HVM_MAX_BODY_BYTES) {
        return null;
    }
    if (!(json_decode($raw) instanceof stdClass)) {
        return null;
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : null;
}
