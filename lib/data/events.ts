import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/config";
import { mockEvents, mockEnrollments, mockStudents } from "@/lib/data/mock";
import type { BeltColor } from "@/lib/supabase/types";

export type EventRow = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string; // ISO timestamptz
  precio: number;
  cupo: number | null;
  created_at: string;
};

export type EventInput = {
  titulo: string;
  descripcion: string | null;
  fecha: string;
  precio: number;
  cupo: number | null;
};

export type EnrollmentWithStudent = {
  id: string;
  event_id: string;
  student_id: string;
  pagado: boolean;
  pagado_at: string | null;
  created_at: string;
  nombre: string;
  dni: string;
  cinturon_actual: BeltColor;
};

export type EnrollResult = { already: boolean; pagado: boolean; titulo: string };

// numeric de Postgres vuelve como string en supabase-js → coerce.
function toEvent(r: {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  precio: number | string;
  cupo: number | null;
  created_at: string;
}): EventRow {
  return { ...r, precio: Number(r.precio) };
}

export async function listEvents(): Promise<EventRow[]> {
  if (isMockMode()) {
    return [...mockEvents].sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
  const sb = await createClient();
  const { data, error } = await sb.from("events").select("*").order("fecha");
  if (error) throw new Error(error.message);
  return data.map(toEvent);
}

export async function getEvent(id: string): Promise<EventRow | null> {
  if (isMockMode()) {
    return mockEvents.find((e) => e.id === id) ?? null;
  }
  const sb = await createClient();
  const { data, error } = await sb
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toEvent(data) : null;
}

export async function createEvent(input: EventInput): Promise<void> {
  if (isMockMode()) {
    mockEvents.push({
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...input,
    });
    return;
  }
  const sb = await createClient();
  const { error } = await sb.from("events").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateEvent(
  id: string,
  input: EventInput,
): Promise<void> {
  if (isMockMode()) {
    const e = mockEvents.find((x) => x.id === id);
    if (e) Object.assign(e, input);
    return;
  }
  const sb = await createClient();
  const { error } = await sb.from("events").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteEvent(id: string): Promise<void> {
  if (isMockMode()) {
    const i = mockEvents.findIndex((x) => x.id === id);
    if (i >= 0) mockEvents.splice(i, 1);
    for (let k = mockEnrollments.length - 1; k >= 0; k--) {
      if (mockEnrollments[k].event_id === id) mockEnrollments.splice(k, 1);
    }
    return;
  }
  const sb = await createClient();
  const { error } = await sb.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Inscriptos a un evento (con datos del alumno), para la vista de staff.
export async function listEnrollments(
  eventId: string,
): Promise<EnrollmentWithStudent[]> {
  if (isMockMode()) {
    return mockEnrollments
      .filter((e) => e.event_id === eventId)
      .map((e) => {
        const s = mockStudents.find((x) => x.id === e.student_id);
        return {
          ...e,
          nombre: s?.nombre ?? "—",
          dni: s?.dni ?? "—",
          cinturon_actual: s?.cinturon_actual ?? "blanco",
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  const sb = await createClient();
  const { data, error } = await sb
    .from("event_enrollments")
    .select("*, students(nombre, dni, cinturon_actual)")
    .eq("event_id", eventId);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((r): EnrollmentWithStudent => {
      const s = r.students as unknown as {
        nombre: string;
        dni: string;
        cinturon_actual: BeltColor;
      } | null;
      return {
        id: r.id,
        event_id: r.event_id,
        student_id: r.student_id,
        pagado: r.pagado,
        pagado_at: r.pagado_at,
        created_at: r.created_at,
        nombre: s?.nombre ?? "—",
        dni: s?.dni ?? "—",
        cinturon_actual: s?.cinturon_actual ?? "blanco",
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

// Conteo de inscriptos por evento (vía RPC; el alumno no puede contar por RLS).
export async function eventCounts(): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (isMockMode()) {
    for (const e of mockEnrollments)
      out.set(e.event_id, (out.get(e.event_id) ?? 0) + 1);
    return out;
  }
  const sb = await createClient();
  const { data, error } = await sb.rpc("event_enrollment_counts");
  if (error) throw new Error(error.message);
  for (const r of (data ?? []) as { event_id: string; inscriptos: number }[])
    out.set(r.event_id, r.inscriptos);
  return out;
}

export async function countEnrollments(eventId: string): Promise<number> {
  if (isMockMode()) {
    return mockEnrollments.filter((e) => e.event_id === eventId).length;
  }
  const sb = await createClient();
  const { count, error } = await sb
    .from("event_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function setPagado(
  enrollmentId: string,
  pagado: boolean,
): Promise<void> {
  if (isMockMode()) {
    const e = mockEnrollments.find((x) => x.id === enrollmentId);
    if (e) {
      e.pagado = pagado;
      e.pagado_at = pagado ? new Date().toISOString() : null;
    }
    return;
  }
  const sb = await createClient();
  const { error } = await sb
    .from("event_enrollments")
    .update({ pagado, pagado_at: pagado ? new Date().toISOString() : null })
    .eq("id", enrollmentId);
  if (error) throw new Error(error.message);
}

export async function removeEnrollment(enrollmentId: string): Promise<void> {
  if (isMockMode()) {
    const i = mockEnrollments.findIndex((x) => x.id === enrollmentId);
    if (i >= 0) mockEnrollments.splice(i, 1);
    return;
  }
  const sb = await createClient();
  const { error } = await sb
    .from("event_enrollments")
    .delete()
    .eq("id", enrollmentId);
  if (error) throw new Error(error.message);
}

// Inscripciones del alumno (map event_id → pagado) para marcar estado en su lista.
export async function listMyEnrollments(
  studentId: string,
): Promise<Map<string, { id: string; pagado: boolean }>> {
  const out = new Map<string, { id: string; pagado: boolean }>();
  if (isMockMode()) {
    for (const e of mockEnrollments) {
      if (e.student_id === studentId)
        out.set(e.event_id, { id: e.id, pagado: e.pagado });
    }
    return out;
  }
  const sb = await createClient();
  const { data, error } = await sb
    .from("event_enrollments")
    .select("id, event_id, pagado")
    .eq("student_id", studentId);
  if (error) throw new Error(error.message);
  for (const e of data ?? []) out.set(e.event_id, { id: e.id, pagado: e.pagado });
  return out;
}

// El alumno logueado se anota. En real va por RPC (deriva su ficha de auth.uid()).
export async function enrollSelf(
  eventId: string,
  studentId: string | null,
): Promise<EnrollResult> {
  if (isMockMode()) {
    const sid = studentId ?? mockStudents[0]?.id;
    if (!sid) throw new Error("No estás vinculado a una ficha de alumno");
    const ev = mockEvents.find((e) => e.id === eventId);
    if (!ev) throw new Error("Evento no encontrado");
    const existing = mockEnrollments.find(
      (e) => e.event_id === eventId && e.student_id === sid,
    );
    if (existing)
      return { already: true, pagado: existing.pagado, titulo: ev.titulo };
    const yaInscriptos = mockEnrollments.filter(
      (e) => e.event_id === eventId,
    ).length;
    if (ev.cupo != null && yaInscriptos >= ev.cupo)
      throw new Error("Cupo completo");
    mockEnrollments.push({
      id: crypto.randomUUID(),
      event_id: eventId,
      student_id: sid,
      pagado: false,
      pagado_at: null,
      created_at: new Date().toISOString(),
    });
    return { already: false, pagado: false, titulo: ev.titulo };
  }
  const sb = await createClient();
  const { data, error } = await sb.rpc("enroll_event", { p_event_id: eventId });
  if (error) throw new Error(error.message);
  return data as EnrollResult;
}
