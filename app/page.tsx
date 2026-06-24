import Link from "next/link";
import { ArrowRight, QrCode, Settings, Users, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const vistas = [
  {
    href: "/checkin",
    title: "Check-in",
    desc: "Kiosko público. Escaneá el QR o ingresá tu DNI.",
    icon: QrCode,
  },
  {
    href: "/admin",
    title: "Admin",
    desc: "Alumnos, cinturones, tipos de clase y QR de la academia.",
    icon: Settings,
  },
  {
    href: "/profesor",
    title: "Profesor",
    desc: "Presentes en clase y progreso de cada alumno.",
    icon: Users,
  },
  {
    href: "/alumno",
    title: "Alumno",
    desc: "Tu progreso: cinturón, clases y lo que falta para subir.",
    icon: TrendingUp,
  },
];

export default function Home() {
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
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          BJJ Tracker
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md text-balance">
          Controlá presentes, seguí el progreso de cada cinturón y dejá que tus
          alumnos hagan check-in solos.
        </p>
      </div>

      <div className="relative grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {vistas.map((v) => {
          const Icon = v.icon;
          return (
            <Link key={v.href} href={v.href} className="group">
              <Card
                className={cn(
                  "hover:border-foreground/20 hover:bg-accent/40 h-full p-5 transition-colors",
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      {v.title}
                      <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </div>
                    <p className="text-muted-foreground text-sm">{v.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
