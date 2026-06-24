import Link from "next/link";
import { CalendarDays, QrCode } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { isMockMode } from "@/lib/config";
import { getStudent, firstStudentId } from "@/lib/data/students";
import { getProgress } from "@/lib/data/progress";
import { listStudentHistory } from "@/lib/data/attendance";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BELT_LABEL, BELT_CLASS } from "@/lib/belts";
import { cn } from "@/lib/utils";

export default async function AlumnoPage() {
  const user = await requireRole("alumno", "admin", "profesor");

  // Resolver la ficha de alumno. Sin login real, en modo mock cae al primero (demo).
  const studentId = user.studentId ?? (await firstStudentId());

  if (!studentId) {
    return (
      <Shell email={user.email}>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sin ficha vinculada</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Tu usuario no está vinculado a una ficha de alumno. Pedile al admin
            que la asocie.
          </CardContent>
        </Card>
      </Shell>
    );
  }

  const [student, progress, history] = await Promise.all([
    getStudent(studentId),
    getProgress(studentId),
    listStudentHistory(studentId, 20),
  ]);

  if (!student) {
    return (
      <Shell email={user.email}>
        <p className="text-muted-foreground text-sm">No se encontró la ficha.</p>
      </Shell>
    );
  }

  const requeridas = progress?.clases_requeridas ?? null;
  const contadas = progress?.clases_contadas ?? 0;
  const pct =
    requeridas && requeridas > 0
      ? Math.min(Math.round((contadas / requeridas) * 100), 100)
      : 100;

  return (
    <Shell email={user.email} demo={!user.studentId && isMockMode()}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{student.nombre}</h1>
            <p className="text-muted-foreground text-sm">
              En la academia desde {student.fecha_inicio}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn("ml-auto border text-base", BELT_CLASS[student.cinturon_actual])}
          >
            {BELT_LABEL[student.cinturon_actual]}
          </Badge>
        </div>

        <Button size="lg" className="h-14 w-full text-lg" render={<Link href="/checkin" />}>
          <QrCode className="size-5" /> Hacer check-in
        </Button>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Clases que cuentan" value={contadas} />
          <Stat
            label="Requeridas para subir"
            value={requeridas ?? "—"}
          />
          <Stat
            label="Te faltan"
            value={progress?.clases_faltantes ?? "—"}
          />
        </div>

        <Card>
          <CardContent className="space-y-3 p-6">
            {progress?.cinturon_siguiente ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span>
                    Progreso hacia{" "}
                    <span className="font-medium">
                      {BELT_LABEL[progress.cinturon_siguiente]}
                    </span>
                  </span>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
                <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Cinturón máximo configurado. ¡Felicitaciones!
              </p>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-2 text-lg font-medium">Últimas clases</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground text-center">
                      Todavía no registraste asistencias.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell>{h.fecha}</TableCell>
                      <TableCell>{h.hora.slice(0, 5)}</TableCell>
                      <TableCell>{h.tipo}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-3xl font-semibold">{value}</div>
        <div className="text-muted-foreground text-sm">{label}</div>
      </CardContent>
    </Card>
  );
}

function Shell({
  children,
  email,
  demo,
}: {
  children: React.ReactNode;
  email: string;
  demo?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground text-sm">{email}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href="/eventos" />}>
            <CalendarDays className="size-3.5" /> Eventos
          </Button>
          <LogoutButton />
        </div>
      </div>
      {demo ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          Vista demo (sin Supabase): mostrando un alumno de ejemplo.
        </p>
      ) : null}
      {children}
    </div>
  );
}
