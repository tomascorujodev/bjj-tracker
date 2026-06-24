import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/config";
import {
  mockAcademy,
  mockStudents,
  mockClassTypes,
  mockSchedule,
  mockAttendance,
} from "@/lib/data/mock";
import { getProgress } from "@/lib/data/progress";
import { firstStudentId } from "@/lib/data/students";
import { today } from "@/lib/data/attendance";
import type { CheckInResult } from "@/lib/supabase/types";

// Minutos antes del inicio en los que abre el check-in. Cierra a la hora de inicio.
export const CHECKIN_ABRE_MIN_ANTES = 30;

export type EligibleClass = { id: string; nombre: string; hora_inicio: string };
export type EligibleOk = { ok: true; clases: EligibleClass[] };
export type EligibleErr = { ok: false; error: string };

export type CheckInOk = { ok: true; result: CheckInResult };
export type CheckInErr = { ok: false; error: string };

function toMinutes(hhmmss: string): number {
  const [h, m] = hhmmss.split(":").map(Number);
  return h * 60 + m;
}

// Clases dentro de la ventana de check-in AHORA (hora local del server).
// Mock: calcula la ventana en memoria. Real: RPC eligible_classes_now.
export async function eligibleClassesNow(
  qrToken: string,
): Promise<EligibleOk | EligibleErr> {
  if (isMockMode()) {
    if (qrToken !== mockAcademy.qr_token)
      return { ok: false, error: "QR de academia inválido" };

    const now = new Date();
    const dow = now.getDay();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const clases = mockSchedule
      .filter((s) => {
        if (!s.activo || s.dia_semana !== dow) return false;
        const ct = mockClassTypes.find((c) => c.id === s.class_type_id);
        if (!ct || !ct.activo) return false;
        const ini = toMinutes(s.hora_inicio);
        return nowMin >= ini - CHECKIN_ABRE_MIN_ANTES && nowMin <= ini;
      })
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
      .map((s) => ({
        id: s.class_type_id,
        nombre: mockClassTypes.find((c) => c.id === s.class_type_id)?.nombre ?? "—",
        hora_inicio: s.hora_inicio,
      }));

    return { ok: true, clases };
  }

  const sb = await createClient();
  const { data, error } = await sb.rpc("eligible_classes_now", {
    p_qr_token: qrToken,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, clases: (data as EligibleClass[]) ?? [] };
}

// Registra la asistencia del alumno logueado tras escanear el QR.
// Mock: no hay login → resuelve al primer alumno (demo) y revalida ventana.
// Real: RPC check_in_scan (resuelve el alumno por la sesión).
export async function checkInScan(
  qrToken: string,
  classTypeId: string,
): Promise<CheckInOk | CheckInErr> {
  if (isMockMode()) {
    const elig = await eligibleClassesNow(qrToken);
    if (!elig.ok) return elig;
    if (!elig.clases.some((c) => c.id === classTypeId))
      return {
        ok: false,
        error: "Esa clase no está disponible para check-in en este momento",
      };

    const studentId = await firstStudentId();
    const student = studentId
      ? mockStudents.find((s) => s.id === studentId)
      : undefined;
    if (!student)
      return { ok: false, error: "Tu usuario no está vinculado a una ficha de alumno" };

    const fecha = today();
    const dup = mockAttendance.some(
      (a) =>
        a.student_id === student.id &&
        a.class_type_id === classTypeId &&
        a.fecha === fecha,
    );
    if (dup)
      return { ok: false, error: "Ya registraste tu asistencia a esta clase hoy" };

    mockAttendance.push({
      id: crypto.randomUUID(),
      student_id: student.id,
      class_type_id: classTypeId,
      fecha,
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
  const { data, error } = await sb.rpc("check_in_scan", {
    p_qr_token: qrToken,
    p_class_type_id: classTypeId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, result: data as CheckInResult };
}
