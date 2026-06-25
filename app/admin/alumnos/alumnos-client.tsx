"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { BELTS, BELT_LABEL, BELT_CLASS } from "@/lib/belts";
import { cn } from "@/lib/utils";
import type { StudentRow } from "@/lib/data/students";
import {
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
} from "./actions";

function BeltBadge({ belt }: { belt: StudentRow["cinturon_actual"] }) {
  return (
    <Badge variant="outline" className={cn("border", BELT_CLASS[belt])}>
      {BELT_LABEL[belt]}
    </Badge>
  );
}

function StudentForm({
  student,
  onDone,
}: {
  student?: StudentRow;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = student
        ? await updateStudentAction(student.id, formData)
        : await createStudentAction(formData);
      if (res.ok) {
        toast.success(student ? "Alumno actualizado" : "Alumno creado");
        onDone();
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dni">DNI</Label>
        <Input id="dni" name="dni" defaultValue={student?.dni} inputMode="numeric" maxLength={8} pattern="\d{6,8}" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" defaultValue={student?.nombre} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cinturon_actual">Cinturón</Label>
        <Select name="cinturon_actual" defaultValue={student?.cinturon_actual ?? "blanco"}>
          <SelectTrigger id="cinturon_actual" className="w-full">
            <SelectValue>
              {(value: unknown) =>
                value ? BELT_LABEL[value as keyof typeof BELT_LABEL] : "Elegí"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {BELTS.map((b) => (
              <SelectItem key={b} value={b}>
                {BELT_LABEL[b]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
        <Input
          id="fecha_inicio"
          name="fecha_inicio"
          type="date"
          defaultValue={student?.fecha_inicio}
          onClick={(e) => {
            try {
              e.currentTarget.showPicker();
            } catch {}
          }}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : student ? "Guardar cambios" : "Crear alumno"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AlumnosClient({ students }: { students: StudentRow[] }) {
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [deleting, setDeleting] = useState<StudentRow | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    if (!deleting) return;
    const id = deleting.id;
    startTransition(async () => {
      const res = await deleteStudentAction(id);
      if (res.ok) {
        toast.success("Alumno eliminado");
        setDeleting(null);
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger render={<Button>Nuevo alumno</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo alumno</DialogTitle>
              <DialogDescription>Cargá los datos del alumno.</DialogDescription>
            </DialogHeader>
            <StudentForm onDone={() => setNewOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Cinturón</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  Sin alumnos todavía.
                </TableCell>
              </TableRow>
            ) : (
              students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nombre}</TableCell>
                  <TableCell>{s.dni}</TableCell>
                  <TableCell>
                    <BeltBadge belt={s.cinturon_actual} />
                  </TableCell>
                  <TableCell>{s.fecha_inicio}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button variant="outline" size="sm" onClick={() => setEditing(s)}>
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleting(s)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Editar */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar alumno</DialogTitle>
            <DialogDescription>Modificá los datos del alumno.</DialogDescription>
          </DialogHeader>
          {editing && (
            <StudentForm student={editing} onDone={() => setEditing(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Eliminar */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar alumno</DialogTitle>
            <DialogDescription>
              ¿Eliminar a {deleting?.nombre}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={pending} onClick={confirmDelete}>
              {pending ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
