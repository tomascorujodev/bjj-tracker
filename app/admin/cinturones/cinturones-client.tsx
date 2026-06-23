"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import type { BeltConfigRow } from "@/lib/data/belt-config";
import { updateBeltRequiredAction } from "./actions";

function Belt({ belt }: { belt: BeltConfigRow["cinturon_desde"] }) {
  return (
    <Badge variant="outline" className={cn("border", BELT_CLASS[belt])}>
      {BELT_LABEL[belt]}
    </Badge>
  );
}

function Row({ tramo }: { tramo: BeltConfigRow }) {
  const [value, setValue] = useState(String(tramo.clases_requeridas));
  const [pending, startTransition] = useTransition();
  const dirty = value !== String(tramo.clases_requeridas);

  function save() {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) {
      toast.error("Debe ser un entero ≥ 0.");
      return;
    }
    startTransition(async () => {
      const res = await updateBeltRequiredAction(tramo.id, n);
      if (res.ok) toast.success("Guardado");
      else toast.error(res.error ?? "Error");
    });
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Belt belt={tramo.cinturon_desde} />
          <span className="text-muted-foreground">→</span>
          <Belt belt={tramo.cinturon_hasta} />
        </div>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-28"
        />
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" disabled={!dirty || pending} onClick={save}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function CinturonesClient({ tramos }: { tramos: BeltConfigRow[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tramo</TableHead>
            <TableHead>Clases requeridas</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tramos.map((t) => (
            <Row key={t.id} tramo={t} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
