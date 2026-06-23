import Link from "next/link";
import { isMockMode } from "@/lib/config";
import { devBypassRole } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Sin Supabase real (o con bypass de dev) el login no aplica.
  if (isMockMode() || devBypassRole()) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login deshabilitado en dev</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3 text-sm">
            <p>
              Estás en modo desarrollo (mock o <code>DEV_BYPASS_ROLE</code>). El
              login con email/contraseña requiere un proyecto Supabase real y
              quitar el bypass.
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
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm next={next ?? ""} />
        </CardContent>
      </Card>
    </main>
  );
}
