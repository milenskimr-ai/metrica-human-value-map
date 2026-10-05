<?php
/**
 * METRICA HUMAN VALUE MAP — server settings
 *
 * The only file you need to edit on the server.
 * Paste values between the single quotes. If a password contains a single quote ( ' )
 * or a backslash ( \ ), put a backslash in front of it:  'it\'s'  /  'a\\b'
 */
defined('HVM_APP') || exit;

return [
    // MariaDB — the database and user already exist on the server.
    'db_host'     => 'localhost',       // if the connection is refused, try '127.0.0.1'
    'db_port'     => 3306,
    'db_name'     => 'metrica_hvm',     // exact database name as shown in ISPConfig → Databases
    'db_user'     => 'hvm_app',
    'db_password' => '',                // ← paste the database user's password here

    // Admin dashboard (/admin/): shared password for the Metrica team, 16+ characters.
    // Changing it signs everyone out.
    'admin_password' => '',
];
