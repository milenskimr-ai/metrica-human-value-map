-- =================================================================
-- METRICA HUMAN VALUE MAP — schema (MySQL 8.0.19+)
-- One row per completed test (session). Contact fields stay NULL
-- until the visitor submits the optional lead form.
-- Run as a MySQL administrator:
--   mysql -u root -p metrica_hvm < mysql/001_schema.sql
-- Safe to re-run (CREATE TABLE IF NOT EXISTS).
-- All timestamps are stored in UTC.
-- =================================================================

CREATE TABLE IF NOT EXISTS diagnostic_sessions (
  id                  CHAR(36)     CHARACTER SET ascii NOT NULL,  -- session ID generated in the browser (UUID)
  language            VARCHAR(2)   NOT NULL,
  conference_mode     BOOLEAN      NOT NULL DEFAULT FALSE,
  completed_at        DATETIME(3)  NOT NULL,

  -- all answers as stable IDs, e.g. {"monthly_contacts": ["over_2000"], ...}
  answers             JSON         NOT NULL,
  -- copied out of `answers` for easy filtering
  business_type       VARCHAR(40)  NULL,
  monthly_contacts    VARCHAR(40)  NULL,
  biggest_challenge   VARCHAR(40)  NULL,

  -- computed on the server from `answers` with the scoring config of that moment
  automation_score    TINYINT UNSIGNED NOT NULL,
  human_value_score   TINYINT UNSIGNED NOT NULL,
  cx_maturity_score   TINYINT UNSIGNED NOT NULL,
  automation_level    VARCHAR(6)   NOT NULL,
  human_value_level   VARCHAR(6)   NOT NULL,
  cx_maturity_level   VARCHAR(6)   NOT NULL,
  biggest_opportunity VARCHAR(40)  NOT NULL,
  scoring_version     VARCHAR(40)  NOT NULL,

  -- lead (optional)
  first_name          VARCHAR(100) NULL,
  last_name           VARCHAR(100) NULL,
  company             VARCHAR(200) NULL,
  email               VARCHAR(254) NULL,
  website             VARCHAR(300) NULL,
  phone               VARCHAR(40)  NULL,
  lead_submitted_at   DATETIME(3)  NULL,

  -- consent (GDPR): what was agreed to, when, and in which wording
  consent_given       BOOLEAN      NOT NULL DEFAULT FALSE,
  consent_at          DATETIME(3)  NULL,
  consent_version     VARCHAR(40)  NULL,
  consent_text        TEXT         NULL,

  created_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY idx_completed_at (completed_at),
  KEY idx_lead_submitted_at (lead_submitted_at),

  CONSTRAINT chk_language        CHECK (language IN ('bg', 'en')),
  CONSTRAINT chk_automation      CHECK (automation_score  BETWEEN 0 AND 100),
  CONSTRAINT chk_human_value     CHECK (human_value_score BETWEEN 0 AND 100),
  CONSTRAINT chk_cx_maturity     CHECK (cx_maturity_score BETWEEN 0 AND 100),
  CONSTRAINT chk_levels          CHECK (automation_level  IN ('low', 'medium', 'high')
                                    AND human_value_level IN ('low', 'medium', 'high')
                                    AND cx_maturity_level IN ('low', 'medium', 'high')),
  CONSTRAINT chk_lead_consent    CHECK (email IS NULL OR (consent_given AND consent_at IS NOT NULL))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
