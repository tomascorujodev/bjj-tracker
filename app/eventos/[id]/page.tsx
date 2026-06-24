import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { firstStudentId } from "@/lib/data/students";
import { getEvent, listMyEnrollments, eventCounts } from "@/lib/data/events";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, formatEventDate } from "@/lib/format";
import { EnrollButton, type EnrollStatus } from "../enroll-button";

export default async function EventoAlumnoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("alumno", "admin", "profesor");
  const { id } = await params;

  const event = await getEvent(id);
  if (!event) notFound();

  const studentId = user.studentId ?? (await firstStudentId());
  const [counts, mine] = await Promise.all([
    eventCounts(),
    studentId ? listMyEnrollments(studentId) : Promise.resolve(new Map()),
  ]);

  const enr = mine.get(id) as { id: string; pagado: boolean } | undefined;
  const status: EnrollStatus = !enr ? "none" : enr.pagado ? "paid" : "enrolled";
  const inscriptos = counts.get(id) ?? 0;
  const full = event.cupo != null && inscriptos >= event.cupo;

  return (
    <div className="space-y-6">
      <Link
        href="/eventos"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-3.5" /> Todos los eventos
      </Link>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold">{event.titulo}</h1>
            <span className="text-lg font-semibold whitespace-nowrap">
              {event.precio > 0 ? formatMoney(event.precio) : "Gratis"}
            </span>
          </div>

          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatEventDate(event.fecha)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" />
              {inscriptos}
              {event.cupo != null ? `/${event.cupo}` : ""} anotados
            </span>
          </div>

          {event.descripcion ? (
            <p className="text-sm whitespace-pre-line">{event.descripcion}</p>
          ) : null}

          <div className="border-t pt-4">
            <EnrollButton eventId={id} status={status} full={full} />
            {status === "enrolled" ? (
              <p className="text-muted-foreground mt-2 text-xs">
                Para confirmar tu lugar, aboná en la academia. El staff marca el
                pago.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
