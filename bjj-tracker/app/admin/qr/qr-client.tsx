"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { regenerateQrAction } from "./actions";

export function QrClient({
  academyId,
  academyName,
  qrToken,
  qrDataUrl,
  checkinUrl,
}: {
  academyId: string;
  academyName: string;
  qrToken: string;
  qrDataUrl: string;
  checkinUrl: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function copy() {
    navigator.clipboard.writeText(checkinUrl);
    toast.success("URL copiada");
  }

  function regenerate() {
    startTransition(async () => {
      const res = await regenerateQrAction(academyId);
      if (res.ok) {
        toast.success("QR regenerado. El QR anterior deja de funcionar.");
        setConfirmOpen(false);
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  return (
    <>
      <Card className="mx-auto w-fit print:border-0 print:shadow-none">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <h2 className="text-xl font-semibold">{academyName}</h2>
          <p className="text-muted-foreground text-sm">Escaneá para hacer check-in</p>
          <Image
            src={qrDataUrl}
            alt={`QR de check-in de ${academyName}`}
            width={320}
            height={320}
            unoptimized
            className="rounded"
          />
          <code className="text-muted-foreground text-xs break-all">{qrToken}</code>
        </CardContent>
      </Card>

      <div className="no-print flex flex-wrap justify-center gap-2">
        <Button onClick={() => window.print()}>Imprimir</Button>
        <Button variant="outline" onClick={copy}>
          Copiar URL
        </Button>
        <Button variant="outline" onClick={() => setConfirmOpen(true)}>
          Regenerar
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerar QR</DialogTitle>
            <DialogDescription>
              Se genera un token nuevo y el QR impreso anterior deja de funcionar.
              Vas a tener que reimprimirlo. ¿Continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={pending} onClick={regenerate}>
              {pending ? "Regenerando…" : "Regenerar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
