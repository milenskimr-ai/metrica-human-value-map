-- =================================================================
-- METRICA HUMAN VALUE MAP — database + application user
-- Run ONCE as a MySQL administrator (NOT as the app user):
--   mysql -u root -p < mysql/000_create_database_and_user.sql
--
-- Before running, replace:
--   CHANGE_ME_STRONG_PASSWORD  → a long random password (store it only in /etc/metrica-hvm/env)
--   'localhost'                → the host the app connects from, if MySQL is on another machine
--
-- Touches nothing else on the server: one new database, one new user.
-- =================================================================

CREATE DATABASE IF NOT EXISTS metrica_hvm
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'hvm_app'@'localhost'
  IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

-- Minimum permissions: read, add and update rows in the app's table only.
-- No DELETE, no schema changes, no access to any other database.
-- Those grants are in 002_grant_app_user.sql (the table must exist first).
