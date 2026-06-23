import { listStudents } from "@/lib/data/students";
import { isMockMode } from "@/lib/config";
import { AlumnosClient } from "./alumnos-client";

export default async function AlumnosPage() {
  const students = await listStudents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Alumnos</h1>
          <p className="text-muted-foreground text-sm">
            {students.length} alumno{students.length === 1 ? "" : "s"}
            {isMockMode() ? " · datos de prueba (sin Supabase)" : ""}
          </p>
        </div>
      </div>
      <AlumnosClient students={students} />
    </div>
  );
}
