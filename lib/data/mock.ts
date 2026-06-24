// Almacén en memoria para modo mock (dev sin Supabase real).
// Las mutaciones persisten mientras viva el proceso del dev server.
import type { StudentRow } from "@/lib/data/students";
import type { ClassTypeRow } from "@/lib/data/class-types";
import type { BeltConfigRow } from "@/lib/data/belt-config";
import type { AcademyRow } from "@/lib/data/academy";
import type { EventRow } from "@/lib/data/events";
import type { ClassScheduleRow } from "@/lib/data/schedule";
import type { PendingRequest } from "@/lib/data/enrollment";

function uid() {
  return crypto.randomUUID();
}

export const mockStudents: StudentRow[] = [
  {
    id: uid(),
    dni: "30111222",
    nombre: "Juan Pérez",
    foto_url: null,
    cinturon_actual: "azul",
    fecha_inicio: "2022-03-01",
    created_at: new Date().toISOString(),
  },
  {
    id: uid(),
    dni: "28999888",
    nombre: "María Gómez",
    foto_url: null,
    cinturon_actual: "blanco",
    fecha_inicio: "2024-09-15",
    created_at: new Date().toISOString(),
  },
  {
    id: uid(),
    dni: "33444555",
    nombre: "Lucas Fernández",
    foto_url: null,
    cinturon_actual: "violeta",
    fecha_inicio: "2019-06-10",
    created_at: new Date().toISOString(),
  },
];

export const mockClassTypes: ClassTypeRow[] = [
  { id: uid(), nombre: "Gi", activo: true, cuenta_para_progreso: true },
  { id: uid(), nombre: "No-Gi", activo: true, cuenta_para_progreso: true },
  { id: uid(), nombre: "Kids", activo: true, cuenta_para_progreso: false },
  { id: uid(), nombre: "Competición", activo: true, cuenta_para_progreso: false },
];

export const mockBeltConfig: BeltConfigRow[] = [
  { id: uid(), cinturon_desde: "blanco", cinturon_hasta: "azul", clases_requeridas: 150 },
  { id: uid(), cinturon_desde: "azul", cinturon_hasta: "violeta", clases_requeridas: 200 },
  { id: uid(), cinturon_desde: "violeta", cinturon_hasta: "marron", clases_requeridas: 200 },
  { id: uid(), cinturon_desde: "marron", cinturon_hasta: "negro", clases_requeridas: 250 },
];

export const mockAcademy: AcademyRow = {
  id: uid(),
  nombre: "Academia Principal",
  qr_token: "11111111-1111-1111-1111-111111111111",
  created_at: new Date().toISOString(),
};

export type AttendanceRecord = {
  id: string;
  student_id: string;
  class_type_id: string;
  fecha: string;
  hora: string;
};

const TODAY = new Date().toISOString().slice(0, 10);
const GI = mockClassTypes[0].id;
const NOGI = mockClassTypes[1].id;

// Genera asistencias: histórico (para progreso) + presentes de hoy en Gi.
function buildAttendance(): AttendanceRecord[] {
  const recs: AttendanceRecord[] = [];
  // Histórico: N clases contadas por alumno en fechas pasadas.
  const histPorAlumno = [40, 12, 90]; // Juan, María, Lucas
  mockStudents.forEach((s, i) => {
    const n = histPorAlumno[i] ?? 10;
    for (let k = 0; k < n; k++) {
      const d = new Date();
      d.setDate(d.getDate() - (k + 1));
      recs.push({
        id: uid(),
        student_id: s.id,
        class_type_id: k % 2 === 0 ? GI : NOGI,
        fecha: d.toISOString().slice(0, 10),
        hora: "19:00:00",
      });
    }
  });
  // Presentes hoy en Gi: Juan y Lucas.
  for (const s of [mockStudents[0], mockStudents[2]]) {
    recs.push({
      id: uid(),
      student_id: s.id,
      class_type_id: GI,
      fecha: TODAY,
      hora: "19:05:00",
    });
  }
  return recs;
}

export const mockAttendance: AttendanceRecord[] = buildAttendance();

// ── Eventos ───────────────────────────────────────────────────
function plusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(11, 0, 0, 0);
  return d.toISOString();
}

export const mockEvents: EventRow[] = [
  {
    id: uid(),
    titulo: "Seminario Marcelo García",
    descripcion: "Seminario de 3 horas. Traer gi limpio. Cupos limitados.",
    fecha: plusDays(20),
    precio: 25000,
    cupo: 30,
    created_at: new Date().toISOString(),
  },
  {
    id: uid(),
    titulo: "Juntada de fin de año",
    descripcion: "Open mat + asado. Bienvenidas las familias.",
    fecha: plusDays(45),
    precio: 8000,
    cupo: null,
    created_at: new Date().toISOString(),
  },
];

export type EnrollmentRecord = {
  id: string;
  event_id: string;
  student_id: string;
  pagado: boolean;
  pagado_at: string | null;
  created_at: string;
};

// Juan anotado y pagó; María anotada sin pagar (al primer evento).
export const mockEnrollments: EnrollmentRecord[] = [
  {
    id: uid(),
    event_id: mockEvents[0].id,
    student_id: mockStudents[0].id,
    pagado: true,
    pagado_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: uid(),
    event_id: mockEvents[0].id,
    student_id: mockStudents[1].id,
    pagado: false,
    pagado_at: null,
    created_at: new Date().toISOString(),
  },
];

// ── Horarios de clases ────────────────────────────────────────
function hhmmss(d: Date): string {
  return d.toTimeString().slice(0, 8);
}

const KIDS = mockClassTypes[2].id;

// Una entrada dinámica para HOY que cae dentro de la ventana de check-in
// (inicio = ahora + 15 min → "ahora" está dentro de [inicio-30, inicio]),
// así el flujo de escaneo se puede probar en dev sin esperar a un horario real.
const _now = new Date();
const _demoInicio = new Date(_now.getTime() + 15 * 60_000);
const _demoFin = new Date(_now.getTime() + 90 * 60_000);

export const mockSchedule: ClassScheduleRow[] = [
  {
    id: uid(),
    class_type_id: GI,
    dia_semana: _now.getDay(),
    hora_inicio: hhmmss(_demoInicio),
    hora_fin: hhmmss(_demoFin),
    activo: true,
    created_at: new Date().toISOString(),
  },
  // Grilla semanal de ejemplo.
  { id: uid(), class_type_id: GI, dia_semana: 1, hora_inicio: "19:00:00", hora_fin: "20:30:00", activo: true, created_at: new Date().toISOString() },
  { id: uid(), class_type_id: GI, dia_semana: 3, hora_inicio: "19:00:00", hora_fin: "20:30:00", activo: true, created_at: new Date().toISOString() },
  { id: uid(), class_type_id: GI, dia_semana: 5, hora_inicio: "19:00:00", hora_fin: "20:30:00", activo: true, created_at: new Date().toISOString() },
  { id: uid(), class_type_id: NOGI, dia_semana: 2, hora_inicio: "20:00:00", hora_fin: "21:30:00", activo: true, created_at: new Date().toISOString() },
  { id: uid(), class_type_id: NOGI, dia_semana: 4, hora_inicio: "20:00:00", hora_fin: "21:30:00", activo: true, created_at: new Date().toISOString() },
  { id: uid(), class_type_id: KIDS, dia_semana: 1, hora_inicio: "18:00:00", hora_fin: "19:00:00", activo: true, created_at: new Date().toISOString() },
];

// ── Solicitudes de ingreso pendientes (alumnos por aprobar) ───
export const mockPendingRequests: PendingRequest[] = [
  { id: uid(), email: "pedro.nuevo@mail.com", nombre: "Pedro Nuevo", dni: "40222111" },
  { id: uid(), email: "ana.lopez@mail.com", nombre: "Ana López", dni: "41333000" },
];
