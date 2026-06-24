import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { isMockMode } from "@/lib/config";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { listPendingRequests } from "@/lib/data/enrollment";
import { SolicitudesClient } from "./solicitudes-client";

export default async function SolicitudesPage() {
  const user = await requireRole("admin", "profesor");
  const requests = await listPendingRequests();

  const volver = user.rol === "admin" ? "/admin" : "/profesor";

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground -ml-2"
            render={<Link href={volver} />}
          >
            <ArrowLeft className="size-4" /> Volver
          </Button>
          <h1 className="text-2xl font-semibold">Solicitudes de ingreso</h1>
          <p className="text-muted-foreground text-sm">
            Aceptá a los alumnos que se registraron para que puedan usar la app.
            {isMockMode() ? " · datos de prueba (sin Supabase)" : ""}
          </p>
        </div>
        <LogoutButton />
      </div>

      <SolicitudesClient requests={requests} />
    </div>
  );
}
