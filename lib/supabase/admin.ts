import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Cliente con privilegios (service_role): SOLO server-side. Esquiva la RLS y permite
// operaciones de admin como crear usuarios en Auth. NUNCA importar en componentes cliente.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en el entorno (requerida para crear profesores).",
    );
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
