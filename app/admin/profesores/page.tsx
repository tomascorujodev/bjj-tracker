import { listProfesores } from "@/lib/data/staff";
import { isMockMode } from "@/lib/config";
import { ProfesoresClient } from "./profesores-client";

export default async function ProfesoresPage() {
  const profesores = await listProfesores();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profesores</h1>
        <p className="text-muted-foreground text-sm">
          Creá cuentas de profesor. La contraseña inicial es el documento; al primer
          ingreso el profesor deberá cambiarla.
          {isMockMode() ? " · datos de prueba (sin Supabase)" : ""}
        </p>
      </div>
      <ProfesoresClient profesores={profesores} />
    </div>
  );
}
