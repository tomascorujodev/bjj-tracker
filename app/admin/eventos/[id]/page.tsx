import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getEvent, listEnrollments } from "@/lib/data/events";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, formatEventDate } from "@/lib/format";
import { InscriptosClient } from "./inscriptos-client";

export default async function EventoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin", "profesor");
  const { id } = await params;

  const event = await getEvent(id);
  if (!event) notFound();

  const inscriptos = await listEnrollments(id);
  const pagados = inscriptos.filter((e) => e.pagado).length;
  const recaudado = pagados * event.precio;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/eventos"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-3.5" /> Eventos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{event.titulo}</h1>
        <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatEventDate(event.fecha)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" />
            {inscriptos.length}
            {event.cupo != null ? `/${event.cupo}` : ""} anotados
          </span>
          <span>{event.precio > 0 ? formatMoney(event.precio) : "Gratis"}</span>
        </div>
        {event.descripcion ? (
          <p className="text-muted-foreground mt-3 text-sm">
            {event.descripcion}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Anotados" value={inscriptos.length} />
        <Stat label="Pagaron" value={pagados} />
        <Stat
          label="Recaudado"
          value={event.precio > 0 ? formatMoney(recaudado) : "—"}
        />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">Inscriptos</h2>
        <InscriptosClient eventId={id} inscriptos={inscriptos} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-muted-foreground text-sm">{label}</div>
      </CardContent>
    </Card>
  );
}
