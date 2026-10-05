"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { LoginForm } from "@/components/admin/LoginForm";
import { fetchSessions, logout, type SessionsResult } from "@/lib/admin/api";

const MESSAGES: Record<"not_configured" | "error", [string, string]> = {
  not_configured: [
    "Not configured yet",
    "Fill in db_password and admin_password in api/config.php on the server. /api/health.php shows which one is missing.",
  ],
  error: ["Could not load data", "Check the database connection (open /api/health.php), then reload."],
};

/** Admin dashboard: a static page that loads its data from the PHP backend after sign-in. */
export default function AdminPage() {
  const [state, setState] = useState<SessionsResult | { status: "loading" }>({ status: "loading" });

  const load = useCallback(async () => setState(await fetchSessions()), []);
  useEffect(() => {
    void load();
  }, [load]);

  const signOut = async () => {
    await logout();
    setState({ status: "login" });
  };

  if (state.status === "loading") {
    return <main className="flex min-h-dvh items-center justify-center text-muted">Loading…</main>;
  }
  if (state.status === "login") return <LoginForm onSuccess={load} />;
  if (state.status === "ok") return <AdminDashboard rows={state.rows} onRefresh={load} onLogout={signOut} />;

  const [title, text] = MESSAGES[state.status];
  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <h1 className="text-xl font-bold text-navy-900">{title}</h1>
      <p className="mt-2 text-muted">{text}</p>
      <button onClick={signOut} className="mt-6 text-sm text-muted underline">
        Sign out
      </button>
    </main>
  );
}
