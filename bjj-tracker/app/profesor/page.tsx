import { requireRole } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { isMockMode } from "@/lib/config";
import { listClassTypes } from "@/lib/data/class-types";
import { listStudents } from "@/lib/data/students";
import { listPresentes, presentCountsByType, today } from "@/lib/data/attendance";
import { getProgressMap } from "@/lib/data/progress";
import { ProfesorClient } from "./profesor-client";

export default async function ProfesorPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; fecha?: string }>;
}) {
  await requireRole("admin", "profesor");

  const [tiposAll, students] = await Promise.all([
    listClassTypes(),
    listStudents(),
  ]);
  const tipos = tiposAll.filter((t) => t.activo);

  const sp = await searchParams;
  const fecha = sp.fecha ?? today();

  // Default: tipo elegido por el usuario; si no, el que tenga más presentes
  // ese día; si no, el primero activo.
  let tipo = tipos.find((t) => t.id === sp.tipo)?.id ?? "";
  if (!tipo && tipos.length > 0) {
    const counts = await presentCountsByType(fecha);
    const conMas = tipos
      .map((t) => ({ id: t.id, n: counts[t.id] ?? 0 }))
      .sort((a, b) => b.n - a.n)[0];
    tipo = conMas && conMas.n > 0 ? conMas.id : tipos[0].id;
  }

  const presentes = tipo ? await listPresentes(tipo, fecha) : [];
  const progressMap = await getProgressMap(presentes.map((p) => p.studentId));
  const presentesConProgreso = presentes.map((p) => ({
    ...p,
    progress: progressMap.get(p.studentId) ?? null,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Panel del profesor</h1>
          <p className="text-muted-foreground text-sm">
            Presentes en la clase y progreso de cada alumno.
            {isMockMode() ? " · datos de prueba (sin Supabase)" : ""}
          </p>
        </div>
        <LogoutButton />
      </div>

      <ProfesorClient
        tipos={tipos}
        students={students}
        presentes={presentesConProgreso}
        tipo={tipo}
        fecha={fecha}
      />
    </div>
  );
}
