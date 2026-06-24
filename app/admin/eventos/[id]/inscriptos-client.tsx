"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import type { EnrollmentWithStudent } from "@/lib/data/events";
import { setPagadoAction, removeEnrollmentAction } from "../actions";

function Row({
  eventId,
  ins,
  onRemoved,
}: {
  eventId: string;
  ins: EnrollmentWithStudent;
  onRemoved: (id: string) => void;
}) {
  const [pagado, setPagado] = useState(ins.pagado);
  const [pending, startTransition] = useTransition();

  function togglePagado(v: boolean) {
    setPagado(v); // optimista
    startTransition(async () => {
      const res = await setPagadoAction(eventId, ins.id, v);
      if (!res.ok) {
        setPagado(!v);
        toast.error(res.error ?? "Error");
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await removeEnrollmentAction(eventId, ins.id);
      if (res.ok) {
        toast.success("Inscripción quitada");
        onRemoved(ins.id);
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  return (
    <TableRow
      data-pending={pending ? "" : undefined}
      className="data-[pending]:opacity-60"
    >
      <TableCell className="font-medium">{ins.nombre}</TableCell>
      <TableCell>{ins.dni}</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn("border", BELT_CLASS[ins.cinturon_actual])}
        >
          {BELT_LABEL[ins.cinturon_actual]}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Switch
            checked={pagado}
            onCheckedChange={togglePagado}
            aria-label="Pagado"
          />
          <span
            className={cn(
              "text-xs",
              pagado ? "text-chart-3" : "text-muted-foreground",
            )}
          >
            {pagado ? "Pagado" : "Pendiente"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={remove}
          disabled={pending}
        >
          Quitar
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function InscriptosClient({
  eventId,
  inscriptos,
}: {
  eventId: string;
  inscriptos: EnrollmentWithStudent[];
}) {
  const [list, setList] = useState(inscriptos);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Cinturón</TableHead>
            <TableHead className="text-center">Pago</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-muted-foreground text-center"
              >
                Nadie anotado todavía.
              </TableCell>
            </TableRow>
          ) : (
            list.map((ins) => (
              <Row
                key={ins.id}
                eventId={eventId}
                ins={ins}
                onRemoved={(id) =>
                  setList((l) => l.filter((x) => x.id !== id))
                }
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
