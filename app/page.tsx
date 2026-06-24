import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

function panelFor(rol: string): string {
  if (rol === "admin") return "/admin";
  if (rol === "profesor") return "/profesor";
  return "/alumno";
}

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-12 overflow-hidden p-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,var(--color-chart-1)/12%,transparent_70%)]"
      />

      <div className="relative space-y-4 text-center">
        <div className="text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
          <span className="bg-chart-3 size-1.5 rounded-full" />
          Asistencia y progreso para tu academia
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">BJJ Tracker</h1>
        <p className="text-muted-foreground mx-auto max-w-md text-balance">
          Controlá presentes, seguí el progreso de cada cinturón y dejá que tus
          alumnos hagan check-in solos.
        </p>
      </div>

      <div className="relative flex w-full max-w-xs flex-col gap-3">
        {user ? (
          <Button size="lg" className="h-12 text-base" render={<Link href={panelFor(user.rol)} />}>
            Ir a mi panel
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button size="lg" className="h-12 text-base" render={<Link href="/login" />}>
            Iniciar sesión
          </Button>
        )}
      </div>
    </main>
  );
}
