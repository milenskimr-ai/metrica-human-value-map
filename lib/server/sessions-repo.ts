import "server-only";
import type { Pool, RowDataPacket } from "mysql2/promise";
import type { AdminRow } from "@/lib/admin/types";
import type { LeadFields, SessionRow } from "./records";

/** All SQL for the diagnostic_sessions table lives here. Values are always passed as parameters. */

const TABLE = "diagnostic_sessions";
const MAX_ADMIN_ROWS = 50_000;

const SESSION_COLUMNS = [
  "id", "language", "conference_mode", "completed_at", "answers", "business_type", "monthly_contacts",
  "biggest_challenge", "automation_score", "human_value_score", "cx_maturity_score", "automation_level",
  "human_value_level", "cx_maturity_level", "biggest_opportunity", "scoring_version",
] as const;

const LEAD_COLUMNS = [
  "first_name", "last_name", "company", "email", "website", "phone", "lead_submitted_at",
  "consent_given", "consent_at", "consent_version", "consent_text",
] as const;

const sessionValues = (r: SessionRow) =>
  SESSION_COLUMNS.map((c) => (c === "answers" ? JSON.stringify(r.answers) : r[c]));

/** Stores a completed test. A repeated call for the same session changes nothing. */
export async function insertCompletedTest(db: Pool, row: SessionRow): Promise<void> {
  await db.query(
    `INSERT INTO ${TABLE} (${SESSION_COLUMNS.join(", ")}) VALUES (?) ON DUPLICATE KEY UPDATE id = id`,
    [sessionValues(row)],
  );
}

/**
 * Adds contact details + consent to a session. If the completed-test call never
 * arrived, the whole row is inserted. One atomic statement either way; the
 * original test data and completion time are never overwritten.
 */
export async function upsertLead(db: Pool, row: SessionRow, lead: LeadFields): Promise<void> {
  const columns = [...SESSION_COLUMNS, ...LEAD_COLUMNS];
  const values = [...sessionValues(row), ...LEAD_COLUMNS.map((c) => lead[c])];
  const updates = LEAD_COLUMNS.map((c) => `${c} = new.${c}`).join(", ");
  await db.query(
    `INSERT INTO ${TABLE} (${columns.join(", ")}) VALUES (?) AS new ON DUPLICATE KEY UPDATE ${updates}`,
    [values],
  );
}

export async function listSessions(db: Pool): Promise<AdminRow[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT ${[...SESSION_COLUMNS, ...LEAD_COLUMNS].join(", ")} FROM ${TABLE}
     ORDER BY completed_at DESC, id LIMIT ${MAX_ADMIN_ROWS}`,
  );
  return rows.map(toAdminRow);
}

/** Cheap check that the database answers and the table is readable by the app user. */
export async function pingTable(db: Pool): Promise<void> {
  await db.query(`SELECT 1 FROM ${TABLE} LIMIT 1`);
}

const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : d == null ? null : String(d));

function toAdminRow(r: RowDataPacket): AdminRow {
  return {
    id: r.id,
    language: r.language,
    conference_mode: Boolean(r.conference_mode),
    completed_at: iso(r.completed_at)!,
    answers: typeof r.answers === "string" ? JSON.parse(r.answers) : r.answers,
    biggest_challenge: r.biggest_challenge,
    automation_score: r.automation_score,
    human_value_score: r.human_value_score,
    cx_maturity_score: r.cx_maturity_score,
    automation_level: r.automation_level,
    human_value_level: r.human_value_level,
    cx_maturity_level: r.cx_maturity_level,
    biggest_opportunity: r.biggest_opportunity,
    scoring_version: r.scoring_version,
    first_name: r.first_name,
    last_name: r.last_name,
    company: r.company,
    email: r.email,
    website: r.website,
    phone: r.phone,
    lead_submitted_at: iso(r.lead_submitted_at),
    consent_given: Boolean(r.consent_given),
    consent_at: iso(r.consent_at),
    consent_version: r.consent_version,
    consent_text: r.consent_text,
  };
}
