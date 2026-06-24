"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { PendingRequest } from "@/lib/data/enrollment";
import { approveAction, rejectAction } from "./actions";

export function SolicitudesClient({ requests }: { requests: PendingRequest[] }) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground p-8 text-center text-sm">
          No hay solicitudes pendientes.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <RequestRow key={r.id} req={r} />
      ))}
    </div>
  );
}

function RequestRow({ req }: { req: PendingRequest }) {
  const [pending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      const res = await approveAction(req.id);
      if (res.ok) toast.success(`${req.nombre ?? "Alumno"} aceptado`);
      else toast.error(res.error ?? "Error");
    });
  }

  return (
    <Card data-pending={pending ? "" : undefined} className="data-[pending]:opacity-60">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{req.nombre ?? "Sin nombre"}</p>
          <p className="text-muted-foreground truncate text-sm">
            DNI {req.dni ?? "—"} · {req.email}
          </p>
        </div>
        <div className="flex gap-2">
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm" disabled={pending}>
                <X className="size-4" /> Rechazar
              </Button>
            }
            title="Rechazar solicitud"
            description={`¿Rechazar la solicitud de ${req.nombre ?? "este alumno"}? No podrá acceder a la app.`}
            confirmLabel="Rechazar"
            pendingLabel="Rechazando…"
            onConfirm={async () => {
              const res = await rejectAction(req.id);
              if (res.ok) toast.success("Solicitud rechazada");
              else toast.error(res.error ?? "Error");
              return res.ok;
            }}
          />
          <Button size="sm" onClick={approve} disabled={pending}>
            <Check className="size-4" /> Aceptar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
