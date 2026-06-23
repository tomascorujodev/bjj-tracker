"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { updateBeltRequired } from "@/lib/data/belt-config";

export type ActionResult = { ok: boolean; error?: string };

export async function updateBeltRequiredAction(
  id: string,
  clasesRequeridas: number,
): Promise<ActionResult> {
  await requireRole("admin");
  if (!Number.isInteger(clasesRequeridas) || clasesRequeridas < 0)
    return { ok: false, error: "Debe ser un entero ≥ 0." };
  try {
    await updateBeltRequired(id, clasesRequeridas);
    revalidatePath("/admin/cinturones");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
