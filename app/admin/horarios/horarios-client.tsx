"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClassScheduleRow } from "@/lib/data/schedule";
import {
  createScheduleAction,
  toggleScheduleAction,
  deleteScheduleAction,
} from "./actions";

const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

type Tipo = { id: string; nombre: string };

export function HorariosClient({
  schedule,
  tipos,
}: {
  schedule: ClassScheduleRow[];
  tipos: Tipo[];
}) {
  const nombreDe = (id: string) => tipos.find((t) => t.id === id)?.nombre ?? "—";

  return (
    <div className="space-y-6">
      <AddForm tipos={tipos} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Día</TableHead>
              <TableHead>Clase</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead className="text-center">Activo</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  No hay horarios cargados todavía.
                </TableCell>
              </TableRow>
            ) : (
              schedule.map((s) => (
                <Row key={s.id} row={s} nombre={nombreDe(s.class_type_id)} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Row({ row, nombre }: { row: ClassScheduleRow; nombre: string }) {
  const [pending, startTransition] = useTransition();

  function toggle(activo: boolean) {
    startTransition(async () => {
      const res = await toggleScheduleAction(row.id, activo);
      if (!res.ok) toast.error(res.error ?? "Error");
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteScheduleAction(row.id);
      if (!res.ok) toast.error(res.error ?? "Error");
    });
  }

  return (
    <TableRow data-pending={pending ? "" : undefined} className="data-[pending]:opacity-60">
      <TableCell>{DIAS[row.dia_semana]}</TableCell>
      <TableCell className="font-medium">{nombre}</TableCell>
      <TableCell>{row.hora_inicio.slice(0, 5)}</TableCell>
      <TableCell>{row.hora_fin.slice(0, 5)}</TableCell>
      <TableCell className="text-center">
        <Switch
          checked={row.activo}
          onCheckedChange={toggle}
          aria-label="Activo"
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={remove}
          aria-label="Eliminar horario"
        >
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function AddForm({ tipos }: { tipos: Tipo[] }) {
  const [typeId, setTypeId] = useState("");
  const [dia, setDia] = useState("");
  const [inicio, setInicio] = useState("19:00");
  const [fin, setFin] = useState("20:30");
  const [pending, startTransition] = useTransition();

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createScheduleAction({
        class_type_id: typeId,
        dia_semana: Number(dia),
        hora_inicio: inicio,
        hora_fin: fin,
      });
      if (res.ok) {
        toast.success("Horario agregado");
        setTypeId("");
        setDia("");
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  const ready = typeId && dia !== "" && inicio && fin;

  return (
    <form
      onSubmit={add}
      className="bg-card grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
    >
      <div className="space-y-1.5">
        <Label>Clase</Label>
        <Select value={typeId} onValueChange={(v) => setTypeId(v as string)}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: unknown) =>
                v ? (tipos.find((t) => t.id === v)?.nombre ?? "") : "Elegí la clase"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tipos.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Día</Label>
        <Select value={dia} onValueChange={(v) => setDia(v as string)}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: unknown) =>
                v !== "" && v != null ? DIAS[Number(v)] : "Elegí el día"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DIAS.map((d, i) => (
              <SelectItem key={i} value={String(i)}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inicio">Inicio</Label>
        <Input
          id="inicio"
          type="time"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fin">Fin</Label>
        <Input
          id="fin"
          type="time"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={pending || !ready}>
        Agregar
      </Button>
    </form>
  );
}
