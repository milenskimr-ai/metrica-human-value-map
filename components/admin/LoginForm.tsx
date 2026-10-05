"use client";

import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { login, type LoginResult } from "@/lib/admin/api";
import { Logo } from "../ui/Logo";
import { Button } from "../ui/Button";

const MESSAGES: Record<Exclude<LoginResult, "ok">, string> = {
  invalid: "Incorrect password.",
  not_configured: "Admin access is not configured. Set admin_password in api/config.php on the server.",
  error: "Could not reach the server. Please try again.",
};

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<Exclude<LoginResult, "ok"> | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await login(password);
    setPending(false);
    if (result === "ok") onSuccess();
    else setError(result);
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-lift">
        <Logo />
        <h1 className="mt-6 flex items-center gap-2 text-xl font-bold text-navy-900">
          <Lock className="size-5 text-accent-600" /> Admin dashboard
        </h1>
        <label className="mt-6 block">
          <span className="mb-1.5 block text-sm font-medium text-navy-800">Password</span>
          <input
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-xl border border-line px-4 outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/15"
          />
        </label>
        {error && <p className="mt-3 text-sm text-red-600">{MESSAGES[error]}</p>}
        <Button type="submit" disabled={pending} className="mt-6 w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
