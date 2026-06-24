import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/config";
import { mockSchedule } from "@/lib/data/mock";

export type ClassScheduleRow = {
  id: string;
  class_type_id: string;
  dia_semana: number; // 0=domingo .. 6=sábado
  hora_inicio: string; // "HH:MM:SS"
  hora_fin: string;
  activo: boolean;
  created_at: string;
};

export type ScheduleInput = {
  class_type_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
};

export type SchedulePatch = Partial<Omit<ClassScheduleRow, "id" | "created_at">>;

function bySlot(a: ClassScheduleRow, b: ClassScheduleRow): number {
  return a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio);
}

export async function listSchedule(): Promise<ClassScheduleRow[]> {
  if (isMockMode()) {
    return [...mockSchedule].sort(bySlot);
  }
  const sb = await createClient();
  const { data, error } = await sb
    .from("class_schedule")
    .select("*")
    .order("dia_semana")
    .order("hora_inicio");
  if (error) throw new Error(error.message);
  return data;
}

export async function createSchedule(input: ScheduleInput): Promise<void> {
  if (isMockMode()) {
    mockSchedule.push({
      id: crypto.randomUUID(),
      activo: true,
      created_at: new Date().toISOString(),
      ...input,
    });
    return;
  }
  const sb = await createClient();
  const { error } = await sb.from("class_schedule").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateSchedule(
  id: string,
  patch: SchedulePatch,
): Promise<void> {
  if (isMockMode()) {
    const s = mockSchedule.find((x) => x.id === id);
    if (s) Object.assign(s, patch);
    return;
  }
  const sb = await createClient();
  const { error } = await sb.from("class_schedule").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSchedule(id: string): Promise<void> {
  if (isMockMode()) {
    const i = mockSchedule.findIndex((x) => x.id === id);
    if (i >= 0) mockSchedule.splice(i, 1);
    return;
  }
  const sb = await createClient();
  const { error } = await sb.from("class_schedule").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
