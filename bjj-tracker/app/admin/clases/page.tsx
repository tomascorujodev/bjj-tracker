import { listClassTypes } from "@/lib/data/class-types";
import { isMockMode } from "@/lib/config";
import { ClasesClient } from "./clases-client";

export default async function ClasesPage() {
  const tipos = await listClassTypes();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tipos de clase</h1>
        <p className="text-muted-foreground text-sm">
          Activá los tipos y marcá cuáles cuentan para el progreso de cinturón.
          {isMockMode() ? " · datos de prueba (sin Supabase)" : ""}
        </p>
      </div>
      <ClasesClient tipos={tipos} />
    </div>
  );
}
