import type { AdminRow } from "./types";

/**
 * Browser → PHP admin endpoints (php/api/admin/*.php). The session is an httpOnly cookie set by PHP.
 * Decisions use the HTTP status code only: on hosts where Nginx replaces PHP error responses with
 * its own error pages (ISPConfig "own error documents"), the JSON body of an error may not arrive.
 */

export type SessionsResult =
  | { status: "ok"; rows: AdminRow[] }
  | { status: "login" }
  | { status: "not_configured" | "error" };

export async function fetchSessions(): Promise<SessionsResult> {
  try {
    const res = await fetch("/api/admin/sessions.php", { cache: "no-store", credentials: "same-origin" });
    if (res.status === 401) return { status: "login" };
    if (res.status === 503) return { status: "not_configured" };
    if (!res.ok) return { status: "error" };
    const data = await res.json();
    return Array.isArray(data?.rows) ? { status: "ok", rows: data.rows as AdminRow[] } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

export type LoginResult = "ok" | "invalid" | "not_configured" | "error";

export async function login(password: string): Promise<LoginResult> {
  try {
    const res = await fetch("/api/admin/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ password }),
    });
    if (res.ok) return "ok";
    if (res.status === 401) return "invalid";
    if (res.status === 503) return "not_configured";
    return "error";
  } catch {
    return "error";
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/admin/logout.php", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
}
