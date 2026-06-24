import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

export default async function CambiarPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Si no debe cambiarla, no tiene nada que hacer acá.
  if (!user.mustChangePassword) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">BJJ Tracker</h1>
          <p className="text-muted-foreground text-sm">
            Primer ingreso: elegí tu contraseña
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Cambiar contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
