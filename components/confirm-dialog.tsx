"use client";

import { useState, useTransition, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Modal de confirmación reusable para acciones destructivas.
// `onConfirm` debe devolver `false` si falló (deja el modal abierto); cualquier
// otra cosa lo cierra.
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Eliminar",
  pendingLabel = "Eliminando…",
  onConfirm,
}: {
  trigger: ReactElement;
  title: string;
  description: string;
  confirmLabel?: string;
  pendingLabel?: string;
  onConfirm: () => Promise<boolean | void> | boolean | void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const res = await onConfirm();
      if (res !== false) setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
