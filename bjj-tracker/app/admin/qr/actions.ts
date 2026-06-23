"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { regenerateQrToken } from "@/lib/data/academy";

export type ActionResult = { ok: boolean; error?: string };

export async function regenerateQrAction(
  academyId: string,
): Promise<ActionResult> {
  await requireRole("admin");
  try {
    await regenerateQrToken(academyId);
    revalidatePath("/admin/qr");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
