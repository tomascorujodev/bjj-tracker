import Link from "next/link";
import Image from "next/image";
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
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <Image
            src="/images/climent-club-logo.png"
            alt="Climent Club"
            width={232}
            height={32}
            priority
            className="mx-auto h-8 w-auto"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginForm next={next ?? ""} />
            <p className="text-muted-foreground text-center text-sm">
              ¿Sos alumno nuevo?{" "}
              <Link href="/registro" className="text-foreground underline">
                Inscribite
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
