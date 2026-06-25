"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createProfesor } from "@/lib/data/staff";

export type ActionResult = { ok: boolean; error?: string };

export async function createProfesorAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");

  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const documento = String(formData.get("documento") ?? "").trim();

  if (!nombre) return { ok: false, error: "Ingresá el nombre." };
  if (!email) return { ok: false, error: "Ingresá el email." };
  if (!/^\d{6,8}$/.test(documento))
    return { ok: false, error: "Documento inválido (6 a 8 dígitos)." };

  try {
    await createProfesor({ nombre, email, documento });
    revalidatePath("/admin/profesores");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
