import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { firstStudentId } from "@/lib/data/students";
import { listEvents, listMyEnrollments, eventCounts } from "@/lib/data/events";
import { Card } from "@/components/ui/card";
import { formatMoney, formatEventDate } from "@/lib/format";
import { EnrollButton, type EnrollStatus } from "./enroll-button";

export default async function EventosPage() {
  const user = await requireRole("alumno", "admin", "profesor");
  const studentId = user.studentId ?? (await firstStudentId());

  const [events, counts, mine] = await Promise.all([
    listEvents(),
    eventCounts(),
    studentId ? listMyEnrollments(studentId) : Promise.resolve(new Map()),
  ]);

  const now = Date.now();
  const proximos = events.filter((e) => new Date(e.fecha).getTime() >= now);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Próximos eventos</h1>
        <p className="text-muted-foreground text-sm">
          Anotate a seminarios, juntadas y más.
        </p>
      </div>

      {proximos.length === 0 ? (
        <Card className="p-6">
          <p className="text-muted-foreground text-sm">
            No hay eventos próximos por ahora.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {proximos.map((e) => {
            const enr = mine.get(e.id) as
              | { id: string; pagado: boolean }
              | undefined;
            const status: EnrollStatus = !enr
              ? "none"
              : enr.pagado
                ? "paid"
                : "enrolled";
            const inscriptos = counts.get(e.id) ?? 0;
            const full = e.cupo != null && inscriptos >= e.cupo;
            return (
              <Card key={e.id} className="gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/eventos/${e.id}`}
                    className="font-medium hover:underline"
                  >
                    {e.titulo}
                  </Link>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {e.precio > 0 ? formatMoney(e.precio) : "Gratis"}
                  </span>
                </div>
                <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    {formatEventDate(e.fecha)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {inscriptos}
                    {e.cupo != null ? `/${e.cupo}` : ""} anotados
                  </span>
                </div>
                {e.descripcion ? (
                  <p className="text-muted-foreground text-sm">
                    {e.descripcion}
                  </p>
                ) : null}
                <div className="mt-1">
                  <EnrollButton eventId={e.id} status={status} full={full} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
