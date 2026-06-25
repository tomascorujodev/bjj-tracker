"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StaffMember } from "@/lib/data/staff";
import { createProfesorAction } from "./actions";

export function ProfesoresClient({ profesores }: { profesores: StaffMember[] }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [pending, startTransition] = useTransition();

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createProfesorAction(formData);
      if (res.ok) {
        toast.success("Profesor creado. Contraseña inicial = documento.");
        setNombre("");
        setEmail("");
        setDocumento("");
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  const ready = nombre.trim() && email.trim() && /^\d{6,8}$/.test(documento);

  return (
    <div className="space-y-6">
      <form
        onSubmit={add}
        className="bg-card grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
      >
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="documento">Documento (contraseña inicial)</Label>
          <Input
            id="documento"
            name="documento"
            inputMode="numeric"
            maxLength={8}
            placeholder="Solo números"
            value={documento}
            onChange={(e) => setDocumento(e.target.value.replace(/\D/g, "").slice(0, 8))}
          />
        </div>
        <Button type="submit" disabled={pending || !ready}>
          Crear profesor
        </Button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Documento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profesores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground text-center">
                  No hay profesores cargados todavía.
                </TableCell>
              </TableRow>
            ) : (
              profesores.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre ?? "—"}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>{p.dni ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
