import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/config";
import { mockStudents, mockAttendance, mockClassTypes } from "@/lib/data/mock";
import type { BeltColor } from "@/lib/supabase/types";

export type Presente = {
  attendanceId: string;
  studentId: string;
  nombre: string;
  cinturon_actual: BeltColor;
  hora: string;
};

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Presentes en una clase (tipo + fecha).
export async function listPresentes(
  classTypeId: string,
  fecha: string,
): Promise<Presente[]> {
  if (isMockMode()) {
    return mockAttendance
      .filter((a) => a.class_type_id === classTypeId && a.fecha === fecha)
      .map((a) => {
        const s = mockStudents.find((x) => x.id === a.student_id);
        return {
          attendanceId: a.id,
          studentId: a.student_id,
          nombre: s?.nombre ?? "—",
          cinturon_actual: s?.cinturon_actual ?? "blanco",
          hora: a.hora,
        };
      })
      .sort((x, y) => x.hora.localeCompare(y.hora));
  }

  const sb = await createClient();
  const { data, error } = await sb
    .from("attendance")
    .select("id, hora, students(id, nombre, cinturon_actual)")
    .eq("class_type_id", classTypeId)
    .eq("fecha", fecha)
    .order("hora");
  if (error) throw new Error(error.message);

  type Joined = {
    id: string;
    hora: string;
    students: { id: string; nombre: string; cinturon_actual: BeltColor } | null;
  };
  return (data as unknown as Joined[]).map((r) => ({
    attendanceId: r.id,
    studentId: r.students?.id ?? "",
    nombre: r.students?.nombre ?? "—",
    cinturon_actual: r.students?.cinturon_actual ?? "blanco",
    hora: r.hora,
  }));
}

// Cantidad de presentes por tipo de clase en una fecha (para elegir el tipo por defecto).
export async function presentCountsByType(
  fecha: string,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  if (isMockMode()) {
    for (const a of mockAttendance) {
      if (a.fecha === fecha) counts[a.class_type_id] = (counts[a.class_type_id] ?? 0) + 1;
    }
    return counts;
  }
  const sb = await createClient();
  const { data, error } = await sb
    .from("attendance")
    .select("class_type_id")
    .eq("fecha", fecha);
  if (error) throw new Error(error.message);
  for (const r of data) counts[r.class_type_id] = (counts[r.class_type_id] ?? 0) + 1;
  return counts;
}

export type HistoryItem = { fecha: string; hora: string; tipo: string };

// Historial de asistencias de un alumno (más recientes primero).
export async function listStudentHistory(
  studentId: string,
  limit = 20,
): Promise<HistoryItem[]> {
  if (isMockMode()) {
    return mockAttendance
      .filter((a) => a.student_id === studentId)
      .sort((x, y) => (y.fecha + y.hora).localeCompare(x.fecha + x.hora))
      .slice(0, limit)
      .map((a) => ({
        fecha: a.fecha,
        hora: a.hora,
        tipo: mockClassTypes.find((c) => c.id === a.class_type_id)?.nombre ?? "—",
      }));
  }
  const sb = await createClient();
  const { data, error } = await sb
    .from("attendance")
    .select("fecha, hora, class_types(nombre)")
    .eq("student_id", studentId)
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  type Joined = { fecha: string; hora: string; class_types: { nombre: string } | null };
  return (data as unknown as Joined[]).map((r) => ({
    fecha: r.fecha,
    hora: r.hora,
    tipo: r.class_types?.nombre ?? "—",
  }));
}

export async function addPresente(
  studentId: string,
  classTypeId: string,
  fecha: string,
  registradoPor: string | null,
): Promise<void> {
  if (isMockMode()) {
    mockAttendance.push({
      id: crypto.randomUUID(),
      student_id: studentId,
      class_type_id: classTypeId,
      fecha,
      hora: new Date().toTimeString().slice(0, 8),
    });
    return;
  }
  const sb = await createClient();
  const { error } = await sb.from("attendance").insert({
    student_id: studentId,
    class_type_id: classTypeId,
    fecha,
    registrado_por: registradoPor,
  });
  if (error) throw new Error(error.message);
}

export async function removePresente(attendanceId: string): Promise<void> {
  if (isMockMode()) {
    const i = mockAttendance.findIndex((a) => a.id === attendanceId);
    if (i >= 0) mockAttendance.splice(i, 1);
    return;
  }
  const sb = await createClient();
  const { error } = await sb.from("attendance").delete().eq("id", attendanceId);
  if (error) throw new Error(error.message);
}
