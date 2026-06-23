"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { addPresente, removePresente } from "@/lib/data/attendance";

export type ActionResult = { ok: boolean; error?: string };

export async function addPresenteAction(
  studentId: string,
  classTypeId: string,
  fecha: string,
): Promise<ActionResult> {
  const user = await requireRole("admin", "profesor");
  if (!studentId || !classTypeId || !fecha)
    return { ok: false, error: "Faltan datos." };
  const registradoPor = user.id === "dev-bypass" ? null : user.id;
  try {
    await addPresente(studentId, classTypeId, fecha, registradoPor);
    revalidatePath("/profesor");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function removePresenteAction(
  attendanceId: string,
): Promise<ActionResult> {
  await requireRole("admin", "profesor");
  try {
    await removePresente(attendanceId);
    revalidatePath("/profesor");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
