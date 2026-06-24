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
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("not confirmed"))
      return {
        error:
          "Tu email no está confirmado. Revisá tu casilla o pedile al staff que te active.",
      };
    return { error: "Email o contraseña incorrectos." };
  }

  const user = await getCurrentUser();
  if (!user)
    return { error: "Tu usuario no tiene perfil asignado. Contactá al admin." };

  // Alumno aún no aprobado: a la pantalla de estado, ignorando next.
  if (user.rol === "alumno" && user.estado !== "activo") redirect("/pendiente");

  redirect(next.startsWith("/") ? next : homeFor(user.rol));
}

export type RegisterState = { error?: string };

// Auto-registro del alumno: crea la cuenta en Auth con nombre+DNI en el metadata.
// Un trigger crea su fila en public.users como 'pendiente'. Queda esperando aprobación.
export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!nombre) return { error: "Ingresá tu nombre." };
  if (!/^\d{6,10}$/.test(dni)) return { error: "DNI inválido (6 a 10 dígitos)." };
  if (!email) return { error: "Ingresá tu email." };
  if (password.length < 6)
    return { error: "La contraseña debe tener al menos 6 caracteres." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre, dni } },
  });
  if (error) {
    if (error.message.toLowerCase().includes("registered"))
      return { error: "Ese email ya está registrado. Iniciá sesión." };
    return { error: error.message };
  }

  redirect("/pendiente");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
