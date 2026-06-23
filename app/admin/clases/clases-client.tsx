"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClassTypeRow } from "@/lib/data/class-types";
import { createClassTypeAction, updateClassTypeAction } from "./actions";

function Row({ tipo }: { tipo: ClassTypeRow }) {
  const [pending, startTransition] = useTransition();

  function patch(p: Partial<Omit<ClassTypeRow, "id">>) {
    startTransition(async () => {
      const res = await updateClassTypeAction(tipo.id, p);
      if (!res.ok) toast.error(res.error ?? "Error");
    });
  }

  return (
    <TableRow data-pending={pending ? "" : undefined} className="data-[pending]:opacity-60">
      <TableCell className="font-medium">{tipo.nombre}</TableCell>
      <TableCell className="text-center">
        <Switch
          checked={tipo.activo}
          onCheckedChange={(v) => patch({ activo: v })}
          aria-label="Activo"
        />
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={tipo.cuenta_para_progreso}
          onCheckedChange={(v) => patch({ cuenta_para_progreso: v })}
          aria-label="Cuenta para progreso"
        />
      </TableCell>
    </TableRow>
  );
}

export function ClasesClient({ tipos }: { tipos: ClassTypeRow[] }) {
  const [nombre, setNombre] = useState("");
  const [pending, startTransition] = useTransition();

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createClassTypeAction(formData);
      if (res.ok) {
        toast.success("Tipo de clase creado");
        setNombre("");
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="flex gap-2">
        <Input
          name="nombre"
          placeholder="Nuevo tipo (ej. Open Mat)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" disabled={pending || !nombre.trim()}>
          Agregar
        </Button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-center">Activo</TableHead>
              <TableHead className="text-center">Cuenta para progreso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tipos.map((t) => (
              <Row key={t.id} tipo={t} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
