"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { BELTS } from "@/lib/belts";
import {
  createStudent,
  updateStudent,
  deleteStudent,
  type StudentInput,
} from "@/lib/data/students";
import type { BeltColor } from "@/lib/supabase/types";

export type ActionResult = { ok: boolean; error?: string };

function parseStudent(formData: FormData): StudentInput | string {
  const dni = String(formData.get("dni") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const cinturon = String(formData.get("cinturon_actual") ?? "");
  const fecha = String(formData.get("fecha_inicio") ?? "").trim();

  if (!dni) return "El DNI es obligatorio.";
  if (!/^\d{6,8}$/.test(dni)) return "El DNI debe tener entre 6 y 8 dígitos.";
  if (!nombre) return "El nombre es obligatorio.";
  if (!BELTS.includes(cinturon as BeltColor)) return "Cinturón inválido.";
  if (!fecha || Number.isNaN(Date.parse(fecha)))
    return "Fecha de inicio inválida.";

  return {
    dni,
    nombre,
    cinturon_actual: cinturon as BeltColor,
    fecha_inicio: fecha,
  };
}

export async function createStudentAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = parseStudent(formData);
  if (typeof parsed === "string") return { ok: false, error: parsed };
  try {
    await createStudent(parsed);
    revalidatePath("/admin/alumnos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateStudentAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = parseStudent(formData);
  if (typeof parsed === "string") return { ok: false, error: parsed };
  try {
    await updateStudent(id, parsed);
    revalidatePath("/admin/alumnos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteStudentAction(id: string): Promise<ActionResult> {
  await requireRole("admin");
  try {
    await deleteStudent(id);
    revalidatePath("/admin/alumnos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
