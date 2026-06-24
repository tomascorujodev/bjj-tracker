"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { enrollSelf } from "@/lib/data/events";

export type EnrollActionResult = {
  ok: boolean;
  already?: boolean;
  error?: string;
};

export async function enrollAction(
  eventId: string,
): Promise<EnrollActionResult> {
  const user = await requireRole("alumno", "admin", "profesor");
  try {
    const res = await enrollSelf(eventId, user.studentId);
    revalidatePath("/eventos");
    revalidatePath(`/eventos/${eventId}`);
    return { ok: true, already: res.already };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
