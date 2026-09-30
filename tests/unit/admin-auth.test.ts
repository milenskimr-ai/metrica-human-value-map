import { afterEach, describe, expect, it, vi } from "vitest";
import { checkPassword, isAdminConfigured } from "@/lib/server/admin-auth";

describe("admin password check", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("refuses everything when no password is configured", () => {
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(isAdminConfigured()).toBe(false);
    expect(checkPassword("")).toBe(false);
  });
  it("accepts only the exact password", () => {
    vi.stubEnv("ADMIN_PASSWORD", "correct horse battery");
    expect(checkPassword("correct horse battery")).toBe(true);
    expect(checkPassword("correct horse")).toBe(false);
  });
});
