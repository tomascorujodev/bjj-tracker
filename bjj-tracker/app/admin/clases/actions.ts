"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  createClassType,
  updateClassType,
  type ClassTypePatch,
} from "@/lib/data/class-types";

export type ActionResult = { ok: boolean; error?: string };

export async function createClassTypeAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { ok: false, error: "El nombre es obligatorio." };
  try {
    await createClassType(nombre);
    revalidatePath("/admin/clases");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateClassTypeAction(
  id: string,
  patch: ClassTypePatch,
): Promise<ActionResult> {
  await requireRole("admin");
  const clean: ClassTypePatch = {};
  if (typeof patch.activo === "boolean") clean.activo = patch.activo;
  if (typeof patch.cuenta_para_progreso === "boolean")
    clean.cuenta_para_progreso = patch.cuenta_para_progreso;
  if (typeof patch.nombre === "string") {
    const n = patch.nombre.trim();
    if (!n) return { ok: false, error: "El nombre no puede quedar vacío." };
    clean.nombre = n;
  }
  try {
    await updateClassType(id, clean);
    revalidatePath("/admin/clases");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
