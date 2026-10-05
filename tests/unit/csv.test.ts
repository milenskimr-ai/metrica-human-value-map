import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/admin/csv";

describe("CSV export", () => {
  it("adds a UTF-8 BOM, quotes and neutralises formulas", () => {
    const csv = toCsv(["a", "b"], [["=HYPERLINK(\"x\")", "Иван, Петров"], ["@evil", null]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain(`"Иван, Петров"`);
    expect(csv).toContain("'@evil,");
  });
});
