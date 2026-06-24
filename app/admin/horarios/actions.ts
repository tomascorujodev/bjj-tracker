"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  type ScheduleInput,
} from "@/lib/data/schedule";

export type ActionResult = { ok: boolean; error?: string };

export async function createScheduleAction(
  input: ScheduleInput,
): Promise<ActionResult> {
  await requireRole("admin");

  if (!input.class_type_id) return { ok: false, error: "Elegí la clase." };
  if (
    typeof input.dia_semana !== "number" ||
    input.dia_semana < 0 ||
    input.dia_semana > 6
  )
    return { ok: false, error: "Día inválido." };
  if (!input.hora_inicio || !input.hora_fin)
    return { ok: false, error: "Completá las horas." };
  if (input.hora_fin <= input.hora_inicio)
    return { ok: false, error: "La hora de fin debe ser posterior al inicio." };

  try {
    await createSchedule({
      class_type_id: input.class_type_id,
      dia_semana: input.dia_semana,
      hora_inicio: input.hora_inicio,
      hora_fin: input.hora_fin,
    });
    revalidatePath("/admin/horarios");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function toggleScheduleAction(
  id: string,
  activo: boolean,
): Promise<ActionResult> {
  await requireRole("admin");
  try {
    await updateSchedule(id, { activo });
    revalidatePath("/admin/horarios");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteScheduleAction(id: string): Promise<ActionResult> {
  await requireRole("admin");
  try {
    await deleteSchedule(id);
    revalidatePath("/admin/horarios");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
