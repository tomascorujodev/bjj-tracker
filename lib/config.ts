import type { UserRol } from "@/lib/supabase/types";

const isProd = process.env.NODE_ENV === "production";

// Modo mock: activo en dev cuando NO hay un Supabase real configurado
// (sin URL o con la URL placeholder del .env.local.example).
// En producción nunca es mock.
export function isMockMode(): boolean {
  if (isProd) return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes("placeholder");
}

// Bypass de auth para desarrollo. DEV_BYPASS_ROLE=admin|profesor|alumno
// hace que getCurrentUser()/proxy actúen como ese rol sin login.
// Se ignora por completo en producción.
export function devBypassRole(): UserRol | null {
  if (isProd) return null;
  const r = process.env.DEV_BYPASS_ROLE;
  if (r === "admin" || r === "profesor" || r === "alumno") return r;
  return null;
}
