"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { UserRol } from "@/lib/supabase/types";

export type LoginState = { error?: string };

function homeFor(rol: UserRol): string {
  if (rol === "admin") return "/admin";
  if (rol === "profesor") return "/profesor";
  return "/alumno";
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!email || !password)
    return { error: "Completá email y contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email o contraseña incorrectos." };

  const user = await getCurrentUser();
  if (!user)
    return { error: "Tu usuario no tiene perfil asignado. Contactá al admin." };

  redirect(next.startsWith("/") ? next : homeFor(user.rol));
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
