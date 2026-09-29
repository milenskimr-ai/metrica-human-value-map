import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Shared-password admin access.
 * The session cookie is `<expiry>.<HMAC(expiry)>`, signed with a key derived from
 * ADMIN_PASSWORD — changing the password logs everyone out.
 */

export const ADMIN_COOKIE = "mhvm_admin";
const SESSION_HOURS = 12;

const password = () => process.env.ADMIN_PASSWORD ?? "";
export const isAdminConfigured = () => password().length > 0;

const sha256 = (s: string) => createHash("sha256").update(s).digest();
const sign = (payload: string) =>
  createHmac("sha256", sha256(`mhvm-admin-session:${password()}`)).update(payload).digest("base64url");

function safeEqual(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function checkPassword(input: string): boolean {
  if (!isAdminConfigured()) return false;
  return safeEqual(sha256(input), sha256(password()));
}

export async function startAdminSession() {
  const exp = String(Date.now() + SESSION_HOURS * 3600_000);
  (await cookies()).set(ADMIN_COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(Buffer.from(sig), Buffer.from(sign(exp)));
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
