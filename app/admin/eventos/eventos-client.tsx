"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarDays, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatMoney, formatEventDate, toDatetimeLocal } from "@/lib/format";
import type { EventRow } from "@/lib/data/events";
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
} from "./actions";

export type EventWithCounts = EventRow & {
  inscriptos: number;
  pagados: number;
};

function EventForm({
  event,
  onDone,
}: {
  event?: EventRow;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = event
        ? await updateEventAction(event.id, formData)
        : await createEventAction(formData);
      if (res.ok) {
        toast.success(event ? "Evento actualizado" : "Evento creado");
        onDone();
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          name="titulo"
          defaultValue={event?.titulo}
          placeholder="Seminario, juntada, etc."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={event?.descripcion ?? ""}
          placeholder="Lugar, qué llevar, detalles…"
          className="border-input bg-transparent placeholder:text-muted-foreground focus-visible:ring-ring/50 flex w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha y hora</Label>
          <Input
            id="fecha"
            name="fecha"
            type="datetime-local"
            defaultValue={event ? toDatetimeLocal(event.fecha) : undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="precio">Precio (ARS)</Label>
          <Input
            id="precio"
            name="precio"
            type="number"
            min={0}
            step={500}
            defaultValue={event?.precio ?? 0}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cupo">Cupo máximo (opcional)</Label>
        <Input
          id="cupo"
          name="cupo"
          type="number"
          min={1}
          defaultValue={event?.cupo ?? ""}
          placeholder="Sin límite"
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : event ? "Guardar cambios" : "Crear evento"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function shareLink(eventId: string, titulo: string, fecha: string) {
  const url = `${window.location.origin}/eventos/${eventId}`;
  const msg = `📋 ${titulo} — ${formatEventDate(fecha)}\nAnotate acá: ${url}`;
  return { url, msg };
}

export function EventosClient({ events }: { events: EventWithCounts[] }) {
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [deleting, setDeleting] = useState<EventRow | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    if (!deleting) return;
    const id = deleting.id;
    startTransition(async () => {
      const res = await deleteEventAction(id);
      if (res.ok) {
        toast.success("Evento eliminado");
        setDeleting(null);
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  async function copy(e: EventWithCounts) {
    const { url } = shareLink(e.id, e.titulo, e.fecha);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  function whatsapp(e: EventWithCounts) {
    const { msg } = shareLink(e.id, e.titulo, e.fecha);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Creá un evento y compartí el link por WhatsApp. Los alumnos se anotan
          desde ahí.
        </p>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger render={<Button>Nuevo evento</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo evento</DialogTitle>
              <DialogDescription>
                Seminario, juntada, competencia interna, etc.
              </DialogDescription>
            </DialogHeader>
            <EventForm onDone={() => setNewOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin eventos todavía.</p>
        ) : (
          events.map((e) => {
            const lleno = e.cupo != null && e.inscriptos >= e.cupo;
            return (
              <Card key={e.id} className="gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/admin/eventos/${e.id}`}
                    className="font-medium hover:underline"
                  >
                    {e.titulo}
                  </Link>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {e.precio > 0 ? formatMoney(e.precio) : "Gratis"}
                  </span>
                </div>
                <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    {formatEventDate(e.fecha)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {e.inscriptos}
                    {e.cupo != null ? `/${e.cupo}` : ""} anotados
                    {lleno ? (
                      <span className="text-destructive">· lleno</span>
                    ) : null}
                  </span>
                </div>
                <div className="text-muted-foreground text-xs">
                  {e.pagados} pagaron · {e.inscriptos - e.pagados} pendientes
                  {e.precio > 0
                    ? ` · ${formatMoney(e.pagados * e.precio)} recaudado`
                    : ""}
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => whatsapp(e)}
                  >
                    <Share2 className="size-3.5" /> WhatsApp
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => copy(e)}>
                    Copiar link
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(e)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setDeleting(e)}
                  >
                    Eliminar
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Editar */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
            <DialogDescription>Modificá los datos del evento.</DialogDescription>
          </DialogHeader>
          {editing && (
            <EventForm event={editing} onDone={() => setEditing(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Eliminar */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar evento</DialogTitle>
            <DialogDescription>
              ¿Eliminar &quot;{deleting?.titulo}&quot;? Se borran también las
              inscripciones. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={confirmDelete}
            >
              {pending ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
