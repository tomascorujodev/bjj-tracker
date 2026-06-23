// Almacén en memoria para modo mock (dev sin Supabase real).
// Las mutaciones persisten mientras viva el proceso del dev server.
import type { StudentRow } from "@/lib/data/students";
import type { ClassTypeRow } from "@/lib/data/class-types";
import type { BeltConfigRow } from "@/lib/data/belt-config";
import type { AcademyRow } from "@/lib/data/academy";

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
    cinturon_actual: "blanca",
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
  { id: uid(), cinturon_desde: "blanca", cinturon_hasta: "azul", clases_requeridas: 150 },
  { id: uid(), cinturon_desde: "azul", cinturon_hasta: "violeta", clases_requeridas: 200 },
  { id: uid(), cinturon_desde: "violeta", cinturon_hasta: "marron", clases_requeridas: 200 },
  { id: uid(), cinturon_desde: "marron", cinturon_hasta: "negra", clases_requeridas: 250 },
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
