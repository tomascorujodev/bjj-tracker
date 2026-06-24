import { requireRole } from "@/lib/auth";
import { listEvents, listEnrollments } from "@/lib/data/events";
import { EventosClient, type EventWithCounts } from "./eventos-client";

export default async function EventosPage() {
  await requireRole("admin");

  const events = await listEvents();
  const withCounts: EventWithCounts[] = await Promise.all(
    events.map(async (e) => {
      const ens = await listEnrollments(e.id);
      return {
        ...e,
        inscriptos: ens.length,
        pagados: ens.filter((x) => x.pagado).length,
      };
    }),
  );

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Eventos</h1>
      <EventosClient events={withCounts} />
    </div>
  );
}
