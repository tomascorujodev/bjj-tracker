import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const vistas = [
  {
    href: "/checkin",
    title: "Check-in",
    desc: "Kiosko público. Escaneá el QR o ingresá tu DNI.",
  },
  {
    href: "/admin",
    title: "Admin",
    desc: "Alumnos, cinturones, tipos de clase y QR de la academia.",
  },
  {
    href: "/profesor",
    title: "Profesor",
    desc: "Presentes en clase y progreso de cada alumno.",
  },
  {
    href: "/alumno",
    title: "Alumno",
    desc: "Tu progreso: cinturón, clases y lo que falta para subir.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">BJJ Tracker</h1>
        <p className="text-muted-foreground mt-2">
          Asistencia y progreso para tu academia
        </p>
      </div>
      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {vistas.map((v) => (
          <Link key={v.href} href={v.href} className="group">
            <Card className="h-full transition-colors group-hover:border-foreground/30">
              <CardHeader>
                <CardTitle>{v.title}</CardTitle>
                <CardDescription>{v.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
