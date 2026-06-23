import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/config";
import {
  mockAcademy,
  mockStudents,
  mockClassTypes,
  mockAttendance,
} from "@/lib/data/mock";
import { getProgress } from "@/lib/data/progress";
import { today } from "@/lib/data/attendance";
import type { CheckInResult } from "@/lib/supabase/types";

export type AcademyPublic = { id: string; nombre: string };

// Valida el qr_token y devuelve datos públicos de la academia (o null).
export async function getAcademyByToken(
  qrToken: string,
): Promise<AcademyPublic | null> {
  if (isMockMode()) {
    return qrToken === mockAcademy.qr_token
      ? { id: mockAcademy.id, nombre: mockAcademy.nombre }
      : null;
  }
  const sb = await createClient();
  const { data, error } = await sb.rpc("academy_by_token", {
    p_qr_token: qrToken,
  });
  if (error) throw new Error(error.message);
  const rows = (data as AcademyPublic[]) ?? [];
  return rows[0] ?? null;
}

export type CheckInOk = { ok: true; result: CheckInResult };
export type CheckInErr = { ok: false; error: string };

// Registra la asistencia desde el kiosko. Mock simula; real llama a la RPC check_in.
export async function checkIn(
  qrToken: string,
  dni: string,
  classTypeId: string,
): Promise<CheckInOk | CheckInErr> {
  if (isMockMode()) {
    if (qrToken !== mockAcademy.qr_token)
      return { ok: false, error: "QR de academia inválido" };
    const student = mockStudents.find((s) => s.dni === dni);
    if (!student) return { ok: false, error: "DNI no encontrado" };
    const ct = mockClassTypes.find((c) => c.id === classTypeId);
    if (!ct || !ct.activo)
      return { ok: false, error: "Tipo de clase inválido o inactivo" };

    mockAttendance.push({
      id: crypto.randomUUID(),
      student_id: student.id,
      class_type_id: classTypeId,
      fecha: today(),
      hora: new Date().toTimeString().slice(0, 8),
    });

    const p = await getProgress(student.id);
    return {
      ok: true,
      result: {
        student_id: student.id,
        nombre: student.nombre,
        foto_url: student.foto_url,
        cinturon_actual: student.cinturon_actual,
        cinturon_siguiente: p?.cinturon_siguiente ?? null,
        clases_contadas: p?.clases_contadas ?? 0,
        clases_requeridas: p?.clases_requeridas ?? null,
        clases_faltantes: p?.clases_faltantes ?? 0,
      },
    };
  }

  const sb = await createClient();
  const { data, error } = await sb.rpc("check_in", {
    p_qr_token: qrToken,
    p_dni: dni,
    p_class_type_id: classTypeId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, result: data as CheckInResult };
}
