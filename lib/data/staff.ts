import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMockMode } from "@/lib/config";
import { mockProfesores } from "@/lib/data/mock";

export type StaffMember = {
  id: string;
  email: string;
  nombre: string | null;
  dni: string | null;
};

export type ProfesorInput = {
  nombre: string;
  email: string;
  documento: string; // contraseña temporal
};

export async function listProfesores(): Promise<StaffMember[]> {
  if (isMockMode()) {
    return [...mockProfesores].sort((a, b) =>
      (a.nombre ?? a.email).localeCompare(b.nombre ?? b.email),
    );
  }
  const sb = await createClient();
  const { data, error } = await sb
    .from("users")
    .select("id, email, nombre, dni")
    .eq("rol", "profesor")
    .order("nombre");
  if (error) throw new Error(error.message);
  return data;
}

// Crea la cuenta de profesor con el documento como contraseña temporal.
// Usa la Admin API (service_role). El profe deberá cambiarla al primer ingreso.
export async function createProfesor(input: ProfesorInput): Promise<void> {
  if (isMockMode()) {
    mockProfesores.push({
      id: crypto.randomUUID(),
      email: input.email,
      nombre: input.nombre,
      dni: input.documento,
    });
    return;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.documento,
    email_confirm: true,
    user_metadata: { nombre: input.nombre, dni: input.documento },
  });
  if (error) throw new Error(error.message);
  const id = data.user?.id;
  if (!id) throw new Error("No se pudo crear la cuenta.");

  // El trigger ya creó la fila como alumno/pendiente; la dejamos como profesor activo
  // con la marca de cambio de contraseña obligatorio (upsert por las dudas).
  const { error: e2 } = await admin.from("users").upsert({
    id,
    email: input.email,
    rol: "profesor",
    estado: "activo",
    nombre: input.nombre,
    dni: input.documento,
    must_change_password: true,
  });
  if (e2) throw new Error(e2.message);
}
