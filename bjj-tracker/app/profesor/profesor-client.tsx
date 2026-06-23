"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { BELT_LABEL, BELT_CLASS } from "@/lib/belts";
import { cn } from "@/lib/utils";
import type { ClassTypeRow } from "@/lib/data/class-types";
import type { StudentRow } from "@/lib/data/students";
import type { Presente } from "@/lib/data/attendance";
import type { Progress } from "@/lib/data/progress";
import { addPresenteAction, removePresenteAction } from "./actions";

type PresenteConProgreso = Presente & { progress: Progress | null };

function BeltBadge({ belt }: { belt: StudentRow["cinturon_actual"] }) {
  return (
    <Badge variant="outline" className={cn("border", BELT_CLASS[belt])}>
      {BELT_LABEL[belt]}
    </Badge>
  );
}

function ProgressCell({ p }: { p: Progress | null }) {
  if (!p) return <span className="text-muted-foreground">—</span>;
  if (p.clases_requeridas == null)
    return <span className="text-muted-foreground">Cinturón máximo</span>;
  return (
    <span className="text-sm">
      {p.clases_contadas}/{p.clases_requeridas}
      <span className="text-muted-foreground">
        {" "}
        · faltan {p.clases_faltantes} para {BELT_LABEL[p.cinturon_siguiente!]}
      </span>
    </span>
  );
}

export function ProfesorClient({
  tipos,
  students,
  presentes,
  tipo,
  fecha,
}: {
  tipos: ClassTypeRow[];
  students: StudentRow[];
  presentes: PresenteConProgreso[];
  tipo: string;
  fecha: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [pickStudent, setPickStudent] = useState("");

  function navigate(next: { tipo?: string; fecha?: string }) {
    const params = new URLSearchParams({ tipo, fecha, ...next });
    router.push(`/profesor?${params.toString()}`);
  }

  const presentIds = new Set(presentes.map((p) => p.studentId));
  const ausentes = students.filter((s) => !presentIds.has(s.id));

  function add() {
    if (!pickStudent) return;
    startTransition(async () => {
      const res = await addPresenteAction(pickStudent, tipo, fecha);
      if (res.ok) {
        toast.success("Presente agregado");
        setAddOpen(false);
        setPickStudent("");
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  function remove(attendanceId: string, nombre: string) {
    startTransition(async () => {
      const res = await removePresenteAction(attendanceId);
      if (res.ok) toast.success(`${nombre} quitado de la lista`);
      else toast.error(res.error ?? "Error");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>Tipo de clase</Label>
          <Select value={tipo} onValueChange={(v) => navigate({ tipo: String(v) })}>
            <SelectTrigger className="w-48">
              <SelectValue>
                {(v: unknown) => tipos.find((t) => t.id === v)?.nombre ?? ""}
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
        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha</Label>
          <Input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => navigate({ fecha: e.target.value })}
            className="w-44"
          />
        </div>
        <div className="ml-auto">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger
              render={<Button disabled={!tipo || ausentes.length === 0}>Agregar presente</Button>}
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar presente</DialogTitle>
                <DialogDescription>
                  Registrar manualmente la asistencia de un alumno.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Alumno</Label>
                <Select value={pickStudent} onValueChange={(v) => setPickStudent(String(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v: unknown) =>
                        students.find((s) => s.id === v)?.nombre ?? "Elegí un alumno"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ausentes.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre} · {BELT_LABEL[s.cinturon_actual]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button disabled={!pickStudent || pending} onClick={add}>
                  {pending ? "Agregando…" : "Agregar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        <p className="text-muted-foreground mb-2 text-sm">
          {presentes.length} presente{presentes.length === 1 ? "" : "s"}
        </p>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Cinturón</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presentes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    Nadie registrado en esta clase.
                  </TableCell>
                </TableRow>
              ) : (
                presentes.map((p) => (
                  <TableRow key={p.attendanceId}>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell>
                      <BeltBadge belt={p.cinturon_actual} />
                    </TableCell>
                    <TableCell>{p.hora.slice(0, 5)}</TableCell>
                    <TableCell>
                      <ProgressCell p={p.progress} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => remove(p.attendanceId, p.nombre)}
                      >
                        Quitar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
