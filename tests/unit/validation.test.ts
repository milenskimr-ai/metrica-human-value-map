import { describe, expect, it } from "vitest";
import { cleanEmail, cleanText, isLang, isUuid, parseAnswers } from "@/lib/server/validation";
import { toCsv } from "@/lib/admin/csv";
import { validAnswers } from "../support/answers";

describe("answer validation", () => {
  it("accepts a complete, valid test", () => {
    expect(parseAnswers(validAnswers())).toEqual(validAnswers());
  });
  it("rejects unknown answer IDs", () => {
    expect(parseAnswers(validAnswers({ biggest_challenge: ["hacked"] }))).toBeNull();
  });
  it("rejects a missing question", () => {
    const a = validAnswers();
    delete a.channels;
    expect(parseAnswers(a)).toBeNull();
  });
  it("rejects more than 3 contact reasons", () => {
    expect(parseAnswers(validAnswers({ contact_reasons: ["order_status", "returns", "payment", "other"] }))).toBeNull();
  });
  it("rejects two answers on a single-choice question", () => {
    expect(parseAnswers(validAnswers({ business_type: ["online_brand", "services"] }))).toBeNull();
  });
  it("removes duplicate selections", () => {
    expect(parseAnswers(validAnswers({ channels: ["phone", "phone"] }))?.channels).toEqual(["phone"]);
  });
  it("rejects non-objects", () => {
    expect(parseAnswers("x")).toBeNull();
    expect(parseAnswers(null)).toBeNull();
  });
});

describe("field validation", () => {
  it("checks session IDs and languages", () => {
    expect(isUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isUuid("1; DROP TABLE x")).toBe(false);
    expect(isLang("bg")).toBe(true);
    expect(isLang("de")).toBe(false);
  });
  it("normalises emails and rejects invalid ones", () => {
    expect(cleanEmail("  Ivan@Shop.BG ")).toBe("ivan@shop.bg");
    expect(cleanEmail("not-an-email")).toBeNull();
  });
  it("trims text and enforces length", () => {
    expect(cleanText("  Магазин   Роза ")).toBe("Магазин Роза");
    expect(cleanText("", 10)).toBeNull();
    expect(cleanText("x".repeat(11), 10)).toBeNull();
  });
});

describe("CSV export", () => {
  it("adds a UTF-8 BOM, quotes and neutralises formulas", () => {
    const csv = toCsv(["a", "b"], [["=HYPERLINK(\"x\")", "Иван, Петров"], ["@evil", null]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain(`"Иван, Петров"`);
    expect(csv).toContain("'@evil,");
  });
});
