import { listSchedule } from "@/lib/data/schedule";
import { listClassTypes } from "@/lib/data/class-types";
import { isMockMode } from "@/lib/config";
import { HorariosClient } from "./horarios-client";

export default async function HorariosPage() {
  const [schedule, tipos] = await Promise.all([
    listSchedule(),
    listClassTypes(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Horarios</h1>
        <p className="text-muted-foreground text-sm">
          Definí los días y horas de cada clase. El check-in por QR usa esta grilla
          para saber qué clase es y se habilita desde 30 min antes hasta la hora de
          inicio.
          {isMockMode() ? " · datos de prueba (sin Supabase)" : ""}
        </p>
      </div>
      <HorariosClient
        schedule={schedule}
        tipos={tipos.map((t) => ({ id: t.id, nombre: t.nombre }))}
      />
    </div>
  );
}
