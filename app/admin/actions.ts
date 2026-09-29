"use server";

import { redirect } from "next/navigation";
import { checkPassword, endAdminSession, isAdminConfigured, startAdminSession } from "@/lib/server/admin-auth";

export type LoginState = { error: "invalid" | "not_configured" } | null;

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!isAdminConfigured()) return { error: "not_configured" };
  const input = String(form.get("password") ?? "");
  if (!checkPassword(input)) {
    await new Promise((r) => setTimeout(r, 800)); // slows down password guessing
    return { error: "invalid" };
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/login");
}
