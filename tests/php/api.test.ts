/**
 * HTTP integration tests of the PHP backend (php/api/*.php) against a real MariaDB.
 * Point HVM_BASE_URL at a server that serves the built site (dist/web), e.g.
 *   php -S 127.0.0.1:8080 -t dist/web
 * with api/config.php filled in. Skipped when HVM_BASE_URL is not set.
 */
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import type { AdminRow } from "@/lib/admin/types";
import { validAnswers } from "../support/answers";

const BASE = process.env.HVM_BASE_URL ?? "";
const ADMIN_PASSWORD = process.env.HVM_ADMIN_PASSWORD ?? "";

if (process.env.REQUIRE_PHP_TESTS === "true" && !BASE) {
  throw new Error("REQUIRE_PHP_TESTS is set but HVM_BASE_URL is not — the PHP tests would be skipped");
}

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

let adminCookie = "";
async function rows(): Promise<AdminRow[]> {
  const res = await fetch(BASE + "/api/admin/sessions.php", { headers: { Cookie: adminCookie } });
  expect(res.status).toBe(200);
  return (await res.json()).rows;
}
const findRow = async (id: string) => (await rows()).find((r) => r.id === id);

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

describe.skipIf(!BASE)("PHP backend over HTTP", () => {
  beforeAll(async () => {
    const res = await post("/api/admin/login.php", { password: ADMIN_PASSWORD });
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/mhvm_admin=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    adminCookie = cookie.split(";")[0];
  });

  it("serves the static site", async () => {
    const home = await fetch(BASE + "/");
    expect(home.status).toBe(200);
    expect(await home.text()).toContain("METRICA");
    expect((await fetch(BASE + "/admin/")).status).toBe(200);
  });

  it("reports healthy", async () => {
    const res = await fetch(BASE + "/api/health.php");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, database: "ok", admin: "ok" });
  });

  it("stores a completed test with server-computed scores (client scores ignored)", async () => {
    const id = randomUUID();
    const res = await post("/api/complete.php", { sessionId: id, language: "en", conferenceMode: false, answers: validAnswers(), automation_score: 999 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const row = await findRow(id);
    expect(row).toMatchObject({ language: "en", conference_mode: false, email: null, consent_given: false, scoring_version: expect.any(String) });
    expect(row!.automation_score).toBeLessThanOrEqual(100);
    expect(row!.answers).toEqual(validAnswers());
    expect(row!.completed_at).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
  });

  it("ignores a repeated completion for the same session", async () => {
    const id = randomUUID();
    await post("/api/complete.php", { sessionId: id, language: "bg", answers: validAnswers() });
    const first = await findRow(id);
    await new Promise((r) => setTimeout(r, 20));
    expect((await post("/api/complete.php", { sessionId: id, language: "en", answers: validAnswers({ business_type: ["services"] }) })).status).toBe(200);
    const second = await findRow(id);
    expect(second!.completed_at).toBe(first!.completed_at);
    expect(second!.language).toBe("bg");
    expect(second!.answers.business_type).toEqual(["online_brand"]);
  });

  it("rejects invalid input", async () => {
    const id = randomUUID();
    expect((await post("/api/complete.php", { sessionId: "x", language: "bg", answers: validAnswers() })).status).toBe(400);
    expect((await post("/api/complete.php", { sessionId: id, language: "de", answers: validAnswers() })).status).toBe(400);
    expect((await post("/api/complete.php", { sessionId: id, language: "bg", answers: validAnswers({ channels: ["fax"] }) })).status).toBe(400);
    expect((await post("/api/complete.php", "not json")).status).toBe(400);
    expect((await post("/api/complete.php", "[1,2]")).status).toBe(400);
    expect((await post("/api/complete.php", { sessionId: id, language: "bg", answers: validAnswers(), pad: "x".repeat(20_000) })).status).toBe(400);
    expect((await fetch(BASE + "/api/complete.php")).status).toBe(405);
    expect(await findRow(id)).toBeUndefined();
  });

  it("refuses POSTs from other websites", async () => {
    const res = await post("/api/complete.php", { sessionId: randomUUID(), language: "bg", answers: validAnswers() }, { Origin: "https://evil.example" });
    expect(res.status).toBe(403);
  });

  it("adds a lead with consent to the completed test, keeping the original test data", async () => {
    const id = randomUUID();
    await post("/api/complete.php", { sessionId: id, language: "bg", conferenceMode: true, answers: validAnswers() });
    const before = await findRow(id);
    expect((await post("/api/lead.php", leadBody(id, { answers: validAnswers({ business_type: ["services"] }) }))).status).toBe(200);
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
    expect((await post("/api/lead.php", leadBody(id, { language: "en", phone: "+359 88 123 4567" }))).status).toBe(200);
    const row = await findRow(id);
    expect(row).toMatchObject({ language: "en", email: "ivan@roza.bg", phone: "+359 88 123 4567", consent_given: true });
    expect(row!.consent_text).toMatch(/^I agree/);
  });

  it("refuses a lead without consent or with an invalid email", async () => {
    const id = randomUUID();
    expect((await post("/api/lead.php", leadBody(id, { consent: false }))).status).toBe(400);
    expect((await post("/api/lead.php", leadBody(id, { consent: "true" }))).status).toBe(400);
    expect((await post("/api/lead.php", leadBody(id, { email: "nope" }))).status).toBe(400);
    expect(await findRow(id)).toBeUndefined();
  });

  it("silently drops honeypot submissions", async () => {
    const id = randomUUID();
    expect((await post("/api/lead.php", leadBody(id, { fax: "bot" }))).status).toBe(200);
    expect(await findRow(id)).toBeUndefined();
  });

  it("protects the admin data", async () => {
    expect((await fetch(BASE + "/api/admin/sessions.php")).status).toBe(401);
    const [exp] = adminCookie.replace("mhvm_admin=", "").split(".");
    const forged = `mhvm_admin=${exp}.${"A".repeat(43)}`;
    expect((await fetch(BASE + "/api/admin/sessions.php", { headers: { Cookie: forged } })).status).toBe(401);
    const expired = `mhvm_admin=1000.${"A".repeat(43)}`;
    expect((await fetch(BASE + "/api/admin/sessions.php", { headers: { Cookie: expired } })).status).toBe(401);
    const wrong = await post("/api/admin/login.php", { password: "wrong" });
    expect(wrong.status).toBe(401);
    expect(wrong.headers.get("set-cookie")).toBeNull();
  });

  it("does not expose the settings file", async () => {
    const res = await fetch(BASE + "/api/config.php");
    expect(await res.text()).not.toContain("db_password");
  });

  it("signs out", async () => {
    const res = await post("/api/admin/logout.php", {}, { Cookie: adminCookie });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/mhvm_admin=(deleted)?;/);
  });
});
