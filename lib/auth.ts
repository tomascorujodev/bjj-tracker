import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { devBypassRole } from "@/lib/config";
import type { UserRol, UserEstado } from "@/lib/supabase/types";

export type CurrentUser = {
  id: string;
  email: string;
  rol: UserRol;
  estado: UserEstado;
  studentId: string | null;
  mustChangePassword: boolean;
};

// Devuelve el usuario autenticado + su perfil/rol, o null si no hay sesión.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Bypass de desarrollo: actúa como el rol indicado sin login.
  const bypass = devBypassRole();
  if (bypass) {
    return {
      id: "dev-bypass",
      email: `dev-${bypass}@local`,
      rol: bypass,
      estado: "activo",
      studentId: null,
      mustChangePassword: false,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("rol, estado, student_id, email, must_change_password")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return {
    id: user.id,
    email: profile.email,
    rol: profile.rol,
    estado: profile.estado,
    studentId: profile.student_id,
    mustChangePassword: profile.must_change_password,
  };
}

// Gate para Server Components/Actions: exige sesión y uno de los roles dados.
// Redirige a /login si no hay sesión, o a / si el rol no alcanza.
export async function requireRole(...roles: UserRol[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Contraseña temporal: obligar a cambiarla antes de usar nada.
  if (user.mustChangePassword) redirect("/cambiar-password");
  // Alumno aún no aprobado (o rechazado): no accede a ninguna funcionalidad.
  if (user.rol === "alumno" && user.estado !== "activo") redirect("/pendiente");
  if (roles.length > 0 && !roles.includes(user.rol)) redirect("/");
  return user;
}
