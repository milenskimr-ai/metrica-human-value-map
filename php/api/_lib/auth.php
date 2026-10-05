<?php
declare(strict_types=1);
defined('HVM_APP') || exit;

/**
 * Shared-password admin access (same design as before the PHP rewrite).
 * Cookie = "<expiry ms>.<HMAC(expiry)>", signed with a key derived from admin_password —
 * changing the password signs everyone out. No server-side session storage needed.
 */

const HVM_ADMIN_COOKIE = 'mhvm_admin';
const HVM_SESSION_HOURS = 12;

function hvm_admin_password(): string
{
    return (string) (hvm_config()['admin_password'] ?? '');
}

function hvm_admin_configured(): bool
{
    return hvm_admin_password() !== '';
}

function hvm_check_password(string $input): bool
{
    if (!hvm_admin_configured()) {
        return false;
    }
    return hash_equals(hash('sha256', hvm_admin_password(), true), hash('sha256', $input, true));
}

function hvm_base64url(string $bin): string
{
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}

function hvm_sign(string $payload): string
{
    $key = hash('sha256', 'mhvm-admin-session:' . hvm_admin_password(), true);
    return hvm_base64url(hash_hmac('sha256', $payload, $key, true));
}

function hvm_is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

function hvm_set_admin_cookie(string $value, int $expires): void
{
    setcookie(HVM_ADMIN_COOKIE, $value, [
        'expires' => $expires,
        'path' => '/',
        'secure' => hvm_is_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function hvm_start_admin_session(): void
{
    $expMs = (string) ((time() + HVM_SESSION_HOURS * 3600) * 1000);
    hvm_set_admin_cookie($expMs . '.' . hvm_sign($expMs), time() + HVM_SESSION_HOURS * 3600);
}

function hvm_end_admin_session(): void
{
    hvm_set_admin_cookie('', time() - 3600);
}

function hvm_is_admin(): bool
{
    if (!hvm_admin_configured()) {
        return false;
    }
    $parts = explode('.', (string) ($_COOKIE[HVM_ADMIN_COOKIE] ?? ''), 2);
    if (count($parts) !== 2 || !ctype_digit($parts[0]) || (int) $parts[0] < time() * 1000) {
        return false;
    }
    return hash_equals(hvm_sign($parts[0]), $parts[1]);
}
