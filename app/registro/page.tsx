import Link from "next/link";
import { isMockMode, devBypassRole } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export default async function RegistroPage() {
  // Sin Supabase real (o con bypass de dev) el registro no aplica.
  if (isMockMode() || devBypassRole()) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Registro deshabilitado en dev</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3 text-sm">
            <p>
              Estás en modo desarrollo (mock o <code>DEV_BYPASS_ROLE</code>). El
              registro con email/contraseña requiere un proyecto Supabase real.
            </p>
            <Link href="/" className="underline">
              ← Volver al inicio
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">BJJ Tracker</h1>
          <p className="text-muted-foreground text-sm">
            Creá tu cuenta de alumno
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Inscribirme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RegisterForm />
            <p className="text-muted-foreground text-center text-sm">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="text-foreground underline">
                Iniciá sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
