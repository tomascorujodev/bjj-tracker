import { getAcademyByToken } from "@/lib/data/checkin";
import { listClassTypes } from "@/lib/data/class-types";
import { CheckinClient } from "./checkin-client";

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ academy?: string }>;
}) {
  const { academy } = await searchParams;

  if (!academy) {
    return <Mensaje titulo="Escaneá el QR" texto="Pedile el QR de la academia a tu profesor." />;
  }

  const academia = await getAcademyByToken(academy).catch(() => null);
  if (!academia) {
    return <Mensaje titulo="QR inválido" texto="Este QR no corresponde a ninguna academia." />;
  }

  const tipos = (await listClassTypes()).filter((t) => t.activo);

  return (
    <CheckinClient
      academyToken={academy}
      academyName={academia.nombre}
      tipos={tipos.map((t) => ({ id: t.id, nombre: t.nombre }))}
    />
  );
}

function Mensaje({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      <p className="text-muted-foreground">{texto}</p>
    </main>
  );
}
