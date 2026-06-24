import { redirect } from "next/navigation";
import { Clock, XCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PendientePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Si ya está activo (o es staff), no tiene nada que esperar acá.
  if (user.rol !== "alumno" || user.estado === "activo") redirect("/");

  const rechazado = user.estado === "rechazado";

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div
            className={
              rechazado
                ? "bg-destructive/10 text-destructive mb-2 flex size-16 items-center justify-center rounded-full"
                : "bg-chart-4/15 text-chart-4 mb-2 flex size-16 items-center justify-center rounded-full"
            }
          >
            {rechazado ? <XCircle className="size-8" /> : <Clock className="size-8" />}
          </div>
          <CardTitle>
            {rechazado ? "Solicitud rechazada" : "Solicitud pendiente"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground text-sm">
            {rechazado
              ? "Tu solicitud de ingreso fue rechazada. Si creés que es un error, hablá con tu profesor."
              : "Tu cuenta fue creada y está esperando que un profesor la apruebe. Cuando te acepten vas a poder ver tu progreso y hacer check-in."}
          </p>
          <LogoutButton />
        </CardContent>
      </Card>
    </main>
  );
}
