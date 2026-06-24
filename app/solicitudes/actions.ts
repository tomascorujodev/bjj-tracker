"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { approveRequest, rejectRequest } from "@/lib/data/enrollment";

export type ActionResult = { ok: boolean; error?: string };

export async function approveAction(userId: string): Promise<ActionResult> {
  await requireRole("admin", "profesor");
  try {
    await approveRequest(userId);
    // Aceptar crea/vincula la ficha → refrescar también las vistas que listan alumnos.
    revalidatePath("/solicitudes");
    revalidatePath("/admin/alumnos");
    revalidatePath("/profesor");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function rejectAction(userId: string): Promise<ActionResult> {
  await requireRole("admin", "profesor");
  try {
    await rejectRequest(userId);
    revalidatePath("/solicitudes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
