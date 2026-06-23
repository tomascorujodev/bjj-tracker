import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/config";
import { mockStudents } from "@/lib/data/mock";
import type { BeltColor } from "@/lib/supabase/types";

export type StudentRow = {
  id: string;
  dni: string;
  nombre: string;
  foto_url: string | null;
  cinturon_actual: BeltColor;
  fecha_inicio: string;
  created_at: string;
};

export type StudentInput = {
  dni: string;
  nombre: string;
  cinturon_actual: BeltColor;
  fecha_inicio: string;
};

// Acceso a datos de alumnos. En modo mock usa el almacén en memoria;
// si no, va contra Supabase (RLS aplica).

export async function listStudents(): Promise<StudentRow[]> {
  if (isMockMode()) {
    return [...mockStudents].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  const sb = await createClient();
  const { data, error } = await sb
    .from("students")
    .select("*")
    .order("nombre");
  if (error) throw new Error(error.message);
  return data;
}

export async function getStudent(id: string): Promise<StudentRow | null> {
  if (isMockMode()) {
    return mockStudents.find((s) => s.id === id) ?? null;
  }
  const sb = await createClient();
  const { data, error } = await sb
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Primer alumno (solo para demo en modo mock, cuando el usuario no está vinculado).
export async function firstStudentId(): Promise<string | null> {
  if (isMockMode()) return mockStudents[0]?.id ?? null;
  return null;
}

export async function createStudent(input: StudentInput): Promise<void> {
  if (isMockMode()) {
    mockStudents.push({
      id: crypto.randomUUID(),
      foto_url: null,
      created_at: new Date().toISOString(),
      ...input,
    });
    return;
  }
  const sb = await createClient();
  const { error } = await sb.from("students").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateStudent(
  id: string,
  input: StudentInput,
): Promise<void> {
  if (isMockMode()) {
    const s = mockStudents.find((x) => x.id === id);
    if (s) Object.assign(s, input);
    return;
  }
  const sb = await createClient();
  const { error } = await sb.from("students").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteStudent(id: string): Promise<void> {
  if (isMockMode()) {
    const i = mockStudents.findIndex((x) => x.id === id);
    if (i >= 0) mockStudents.splice(i, 1);
    return;
  }
  const sb = await createClient();
  const { error } = await sb.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
