import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/config";
import { mockStudents, mockClassTypes, mockBeltConfig, mockAttendance } from "@/lib/data/mock";
import type { BeltColor } from "@/lib/supabase/types";

export type Progress = {
  student_id: string;
  nombre: string;
  cinturon_actual: BeltColor;
  cinturon_siguiente: BeltColor | null;
  clases_contadas: number;
  clases_requeridas: number | null;
  clases_faltantes: number;
};

// Calcula el progreso desde las fixtures (solo modo mock).
function mockProgress(studentId: string): Progress | null {
  const s = mockStudents.find((x) => x.id === studentId);
  if (!s) return null;
  const countedTypeIds = new Set(
    mockClassTypes.filter((c) => c.cuenta_para_progreso).map((c) => c.id),
  );
  const contadas = mockAttendance.filter(
    (a) => a.student_id === studentId && countedTypeIds.has(a.class_type_id),
  ).length;
  const bc = mockBeltConfig.find((b) => b.cinturon_desde === s.cinturon_actual);
  const requeridas = bc?.clases_requeridas ?? null;
  return {
    student_id: s.id,
    nombre: s.nombre,
    cinturon_actual: s.cinturon_actual,
    cinturon_siguiente: bc?.cinturon_hasta ?? null,
    clases_contadas: contadas,
    clases_requeridas: requeridas,
    clases_faltantes: Math.max((requeridas ?? 0) - contadas, 0),
  };
}

export async function getProgress(studentId: string): Promise<Progress | null> {
  if (isMockMode()) return mockProgress(studentId);
  const sb = await createClient();
  const { data, error } = await sb
    .from("v_student_progress")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getProgressMap(
  studentIds: string[],
): Promise<Map<string, Progress>> {
  const map = new Map<string, Progress>();
  if (studentIds.length === 0) return map;

  if (isMockMode()) {
    for (const id of studentIds) {
      const p = mockProgress(id);
      if (p) map.set(id, p);
    }
    return map;
  }

  const sb = await createClient();
  const { data, error } = await sb
    .from("v_student_progress")
    .select("*")
    .in("student_id", studentIds);
  if (error) throw new Error(error.message);
  for (const p of data) map.set(p.student_id, p);
  return map;
}
