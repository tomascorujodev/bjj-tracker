"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, Check, QrCode, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BELT_LABEL, BELT_CLASS } from "@/lib/belts";
import { cn } from "@/lib/utils";
import type { CheckInResult } from "@/lib/supabase/types";
import type { EligibleClass } from "@/lib/data/checkin";
import { eligibleClassesAction, checkInScanAction } from "./actions";

type Phase = "idle" | "scanning" | "choosing" | "done" | "error";

// El QR puede contener el token crudo o una URL con ?academy=TOKEN. Sacamos el token.
function extractToken(text: string): string {
  const t = text.trim();
  try {
    const url = new URL(t);
    const a = url.searchParams.get("academy");
    if (a) return a.trim();
  } catch {
    // no era una URL
  }
  return t;
}

export function CheckinClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [token, setToken] = useState("");
  const [choices, setChoices] = useState<EligibleClass[]>([]);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setPhase("idle");
    setToken("");
    setChoices([]);
    setResult(null);
    setError(null);
  }

  function fail(msg: string) {
    setError(msg);
    setPhase("error");
  }

  function doCheckin(tkn: string, classTypeId: string) {
    startTransition(async () => {
      const res = await checkInScanAction(tkn, classTypeId);
      if (res.ok) {
        setResult(res.result);
        setPhase("done");
      } else {
        fail(res.error);
      }
    });
  }

  function onScan(text: string) {
    const tkn = extractToken(text);
    setToken(tkn);
    startTransition(async () => {
      const res = await eligibleClassesAction(tkn);
      if (!res.ok) {
        fail(res.error);
        return;
      }
      if (res.clases.length === 0) {
        fail(
          "No hay ninguna clase por empezar ahora. Si llegaste tarde, pedile al profe que te cargue la asistencia.",
        );
        return;
      }
      if (res.clases.length === 1) {
        doCheckin(tkn, res.clases[0].id);
        return;
      }
      setChoices(res.clases);
      setPhase("choosing");
    });
  }

  if (phase === "done" && result) {
    return <Confirmacion result={result} onNext={reset} />;
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <header className="space-y-1 text-center">
        <div className="text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
          <span className="bg-chart-3 size-1.5 rounded-full" />
          Check-in
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Marcá tu asistencia</h1>
        <p className="text-muted-foreground">
          Escaneá el QR de la academia para registrarte.
        </p>
      </header>

      {phase === "idle" && (
        <div className="bg-card flex flex-col items-center gap-4 rounded-xl border p-8 text-center">
          <div className="bg-muted text-muted-foreground flex size-20 items-center justify-center rounded-full">
            <QrCode className="size-10" />
          </div>
          <p className="text-muted-foreground text-sm">
            Vas a necesitar permitir el acceso a la cámara.
          </p>
          <Button size="lg" className="h-14 w-full text-lg" onClick={() => setPhase("scanning")}>
            <Camera className="size-5" /> Escanear QR
          </Button>
        </div>
      )}

      {phase === "scanning" && (
        <Scanner
          onScan={onScan}
          onCancel={reset}
          onError={fail}
          busy={pending}
        />
      )}

      {phase === "choosing" && (
        <div className="space-y-3">
          <p className="text-muted-foreground text-center text-sm">
            Hay varias clases ahora. Elegí a cuál estás entrando:
          </p>
          {choices.map((c) => (
            <Button
              key={c.id}
              size="lg"
              variant="outline"
              className="h-14 w-full justify-between text-base"
              disabled={pending}
              onClick={() => doCheckin(token, c.id)}
            >
              <span>{c.nombre}</span>
              <span className="text-muted-foreground text-sm">
                {c.hora_inicio.slice(0, 5)}
              </span>
            </Button>
          ))}
          <Button variant="ghost" className="w-full" onClick={reset}>
            Cancelar
          </Button>
        </div>
      )}

      {phase === "error" && (
        <div className="bg-card flex flex-col items-center gap-4 rounded-xl border p-8 text-center">
          <div className="bg-destructive/10 text-destructive flex size-16 items-center justify-center rounded-full">
            <RotateCcw className="size-8" />
          </div>
          <p className="text-sm">{error}</p>
          <Button size="lg" className="h-14 w-full text-lg" onClick={reset}>
            Reintentar
          </Button>
        </div>
      )}
    </main>
  );
}

function Scanner({
  onScan,
  onCancel,
  onError,
  busy,
}: {
  onScan: (text: string) => void;
  onCancel: () => void;
  onError: (msg: string) => void;
  busy: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const reader = new BrowserQRCodeReader();

    (async () => {
      try {
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current!,
          (res, _err, ctrl) => {
            if (res && !doneRef.current) {
              doneRef.current = true;
              ctrl.stop();
              onScan(res.getText());
            }
          },
        );
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      } catch {
        if (!cancelled)
          onError(
            "No pudimos abrir la cámara. Revisá los permisos del navegador e intentá de nuevo.",
          );
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-xl border">
        <video
          ref={videoRef}
          className="size-full object-cover"
          muted
          playsInline
        />
        <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-white/70" />
        {busy && (
          <div className="bg-background/60 absolute inset-0 flex items-center justify-center text-sm">
            Registrando…
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-center text-sm">
        Apuntá al QR pegado en la entrada.
      </p>
      <Button variant="ghost" className="w-full" onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  );
}

function Confirmacion({
  result,
  onNext,
}: {
  result: CheckInResult;
  onNext: () => void;
}) {
  const requeridas = result.clases_requeridas;
  const pct =
    requeridas && requeridas > 0
      ? Math.min(Math.round((result.clases_contadas / requeridas) * 100), 100)
      : 100;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="bg-chart-3/15 text-chart-3 ring-chart-3/30 flex size-20 items-center justify-center rounded-full ring-8">
        <Check className="size-10" strokeWidth={3} />
      </div>
      <div>
        <h1 className="text-3xl font-bold">¡Listo, {result.nombre}!</h1>
        <p className="text-muted-foreground">Asistencia registrada</p>
      </div>

      <Badge
        variant="outline"
        className={cn("border text-base", BELT_CLASS[result.cinturon_actual])}
      >
        Cinturón {BELT_LABEL[result.cinturon_actual]}
      </Badge>

      <div className="w-full space-y-2">
        {result.cinturon_siguiente && requeridas ? (
          <>
            <div className="flex justify-between text-sm">
              <span>
                {result.clases_contadas}/{requeridas} para{" "}
                {BELT_LABEL[result.cinturon_siguiente]}
              </span>
              <span className="text-muted-foreground">
                faltan {result.clases_faltantes}
              </span>
            </div>
            <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            Llevás {result.clases_contadas} clases que cuentan.
          </p>
        )}
      </div>

      <Button size="lg" className="h-14 w-full text-lg" onClick={onNext}>
        Volver al inicio
      </Button>
    </main>
  );
}
