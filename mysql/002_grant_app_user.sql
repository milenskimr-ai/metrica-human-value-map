-- =================================================================
-- Grants the app user the minimum it needs on the one table.
-- Run as a MySQL administrator AFTER 001_schema.sql:
--   mysql -u root -p < mysql/002_grant_app_user.sql
-- Use the same host as in 000_create_database_and_user.sql.
-- =================================================================

GRANT SELECT, INSERT, UPDATE ON metrica_hvm.diagnostic_sessions TO 'hvm_app'@'localhost';
