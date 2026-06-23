import { listBeltConfig } from "@/lib/data/belt-config";
import { isMockMode } from "@/lib/config";
import { CinturonesClient } from "./cinturones-client";

export default async function CinturonesPage() {
  const tramos = await listBeltConfig();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuración de cinturones</h1>
        <p className="text-muted-foreground text-sm">
          Clases requeridas para pasar de un cinturón al siguiente.
          {isMockMode() ? " · datos de prueba (sin Supabase)" : ""}
        </p>
      </div>
      <CinturonesClient tramos={tramos} />
    </div>
  );
}
