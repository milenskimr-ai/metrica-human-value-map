/**
 * Integration tests: real API route handlers against a real MySQL database,
 * connected as the restricted app user (SELECT/INSERT/UPDATE only).
 * Skipped unless MYSQL_DATABASE etc. are set (see .github/workflows/ci.yml).
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getDb, isDatabaseConfigured } from "@/lib/server/db";
import { listSessions } from "@/lib/server/sessions-repo";
import { POST as complete } from "@/app/api/submissions/complete/route";
import { POST as lead } from "@/app/api/submissions/lead/route";
import { GET as health } from "@/app/api/health/route";
import type { AdminRow } from "@/lib/admin/types";
import { validAnswers } from "../support/answers";

const post = (handler: (r: Request) => Promise<Response>, body: unknown) =>
  handler(new Request("http://test.local/api", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));

const findRow = async (id: string): Promise<AdminRow | undefined> => (await listSessions(getDb()!)).find((r) => r.id === id);

const leadBody = (sessionId: string, extra: Record<string, unknown> = {}) => ({
  sessionId,
  language: "bg",
  conferenceMode: true,
  answers: validAnswers(),
  firstName: "Иван",
  lastName: "Петров",
  company: "Магазин Роза ООД",
  email: "Ivan@Roza.BG",
  website: "roza.bg",
  phone: "",
  consent: true,
  fax: "",
  ...extra,
});

if (process.env.REQUIRE_DB_TESTS === "true" && !isDatabaseConfigured()) {
  throw new Error("REQUIRE_DB_TESTS is set but MySQL is not configured — integration tests would be skipped");
}

describe.skipIf(!isDatabaseConfigured())("API + MySQL", () => {
  beforeAll(() => vi.stubEnv("ADMIN_PASSWORD", "integration-test-password"));
  afterAll(async () => {
    vi.unstubAllEnvs();
    await getDb()?.end();
  });

  it("stores a completed test with server-computed scores (client scores ignored)", async () => {
    const id = randomUUID();
    const res = await post(complete, { sessionId: id, language: "en", conferenceMode: false, answers: validAnswers(), automation_score: 999 });
    expect(res.status).toBe(200);
    const row = await findRow(id);
    expect(row).toMatchObject({ language: "en", conference_mode: false, email: null, consent_given: false });
    expect(row!.automation_score).toBeLessThanOrEqual(100);
    expect(row!.answers).toEqual(validAnswers());
    expect(new Date(row!.completed_at).toISOString()).toBe(row!.completed_at);
  });

  it("ignores a repeated completion for the same session", async () => {
    const id = randomUUID();
    await post(complete, { sessionId: id, language: "bg", answers: validAnswers() });
    const first = await findRow(id);
    await new Promise((r) => setTimeout(r, 20));
    expect((await post(complete, { sessionId: id, language: "en", answers: validAnswers({ business_type: ["services"] }) })).status).toBe(200);
    const second = await findRow(id);
    expect(second!.completed_at).toBe(first!.completed_at);
    expect(second!.language).toBe("bg");
    expect(second!.answers.business_type).toEqual(["online_brand"]);
  });

  it("rejects invalid input", async () => {
    const id = randomUUID();
    expect((await post(complete, { sessionId: "x", language: "bg", answers: validAnswers() })).status).toBe(400);
    expect((await post(complete, { sessionId: id, language: "de", answers: validAnswers() })).status).toBe(400);
    expect((await post(complete, { sessionId: id, language: "bg", answers: validAnswers({ channels: ["fax"] }) })).status).toBe(400);
    expect((await post(complete, "not json")).status).toBe(400);
    expect((await post(complete, { sessionId: id, language: "bg", answers: validAnswers(), pad: "x".repeat(20_000) })).status).toBe(400);
    expect(await findRow(id)).toBeUndefined();
  });

  it("adds a lead with consent to the completed test, keeping the original test data", async () => {
    const id = randomUUID();
    await post(complete, { sessionId: id, language: "bg", conferenceMode: true, answers: validAnswers() });
    const before = await findRow(id);

    const res = await post(lead, leadBody(id, { answers: validAnswers({ business_type: ["services"] }) }));
    expect(res.status).toBe(200);
    const row = await findRow(id);
    expect(row).toMatchObject({
      first_name: "Иван",
      company: "Магазин Роза ООД",
      email: "ivan@roza.bg",
      phone: null,
      consent_given: true,
      consent_version: expect.any(String),
    });
    expect(row!.consent_text).toMatch(/^Съгласявам се/);
    expect(row!.consent_at).toBe(row!.lead_submitted_at);
    expect(row!.completed_at).toBe(before!.completed_at);
    expect(row!.answers.business_type).toEqual(["online_brand"]);
  });

  it("stores the whole row when a lead arrives without an earlier completion", async () => {
    const id = randomUUID();
    expect((await post(lead, leadBody(id, { language: "en" }))).status).toBe(200);
    const row = await findRow(id);
    expect(row).toMatchObject({ language: "en", email: "ivan@roza.bg", consent_given: true });
    expect(row!.consent_text).toMatch(/^I agree/);
  });

  it("refuses a lead without consent or with an invalid email", async () => {
    const id = randomUUID();
    expect((await post(lead, leadBody(id, { consent: false }))).status).toBe(400);
    expect((await post(lead, leadBody(id, { email: "nope" }))).status).toBe(400);
    expect(await findRow(id)).toBeUndefined();
  });

  it("silently drops honeypot submissions", async () => {
    const id = randomUUID();
    expect((await post(lead, leadBody(id, { fax: "bot" }))).status).toBe(200);
    expect(await findRow(id)).toBeUndefined();
  });

  it("gives the app user no permission to delete or change the schema", async () => {
    const db = getDb()!;
    await expect(db.query("DELETE FROM diagnostic_sessions")).rejects.toThrow(/denied/);
    await expect(db.query("DROP TABLE diagnostic_sessions")).rejects.toThrow(/denied/);
  });

  it("reports healthy when MySQL and admin access are configured", async () => {
    const res = await health();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, database: "ok", admin: "ok" });
  });

  it("reports unhealthy without an admin password", async () => {
    vi.stubEnv("ADMIN_PASSWORD", "");
    const res = await health();
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, database: "ok", admin: "not_configured" });
    vi.stubEnv("ADMIN_PASSWORD", "integration-test-password");
  });
});
