import { requireAdmin } from "@/lib/server/admin-auth";
import { fetchAllSessions } from "@/lib/server/admin-data";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const result = await fetchAllSessions();

  return (
    <>
      {result.status === "ok" ? (
        <AdminDashboard rows={result.rows} logout={logout} />
      ) : (
        <main className="mx-auto max-w-xl px-5 py-20 text-center">
          <h1 className="text-xl font-bold text-navy-900">
            {result.status === "not_configured" ? "The database is not configured" : "Could not load data"}
          </h1>
          <p className="mt-2 text-muted">
            {result.status === "not_configured"
              ? "Set the MYSQL_* variables in the server environment."
              : "Check the server logs and the MySQL connection, then reload."}
          </p>
          <form action={logout} className="mt-6">
            <button className="text-sm text-muted underline">Sign out</button>
          </form>
        </main>
      )}
    </>
  );
}
