"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BELT_LABEL, BELT_CLASS } from "@/lib/belts";
import { cn } from "@/lib/utils";
import type { CheckInResult } from "@/lib/supabase/types";
import { checkInAction } from "./actions";

type Tipo = { id: string; nombre: string };

export function CheckinClient({
  academyToken,
  academyName,
  tipos,
}: {
  academyToken: string;
  academyName: string;
  tipos: Tipo[];
}) {
  const [dni, setDni] = useState("");
  const [tipo, setTipo] = useState(tipos.length === 1 ? tipos[0].id : "");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setResult(null);
    setDni("");
    if (tipos.length !== 1) setTipo("");
  }

  function press(d: string) {
    setDni((v) => (v.length < 10 ? v + d : v));
  }

  function submit() {
    startTransition(async () => {
      const res = await checkInAction(academyToken, dni, tipo);
      if (res.ok) {
        setResult(res.result);
      } else {
        toast.error(res.error);
      }
    });
  }

  if (result) {
    return (
      <Confirmacion result={result} onNext={reset} />
    );
  }

  const dniOk = /^\d{6,10}$/.test(dni);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">{academyName}</h1>
        <p className="text-muted-foreground">Registrá tu asistencia</p>
      </header>

      <div className="space-y-2">
        <p className="text-sm font-medium">Tipo de clase</p>
        <div className="flex flex-wrap gap-2">
          {tipos.map((t) => (
            <Button
              key={t.id}
              type="button"
              variant={tipo === t.id ? "default" : "outline"}
              onClick={() => setTipo(t.id)}
              className="flex-1"
            >
              {t.nombre}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Tu DNI</p>
        <div className="flex h-14 items-center justify-center rounded-lg border text-3xl font-mono tracking-widest">
          {dni || <span className="text-muted-foreground">—</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <Button
              key={d}
              type="button"
              variant="outline"
              className="h-14 text-xl"
              onClick={() => press(d)}
            >
              {d}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            className="h-14 text-xl"
            onClick={() => setDni((v) => v.slice(0, -1))}
          >
            ⌫
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-14 text-xl"
            onClick={() => press("0")}
          >
            0
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-14 text-sm"
            onClick={() => setDni("")}
          >
            Borrar
          </Button>
        </div>
      </div>

      <Button
        size="lg"
        className="h-14 text-lg"
        disabled={!dniOk || !tipo || pending}
        onClick={submit}
      >
        {pending ? "Registrando…" : "Registrar asistencia"}
      </Button>
    </main>
  );
}

function Confirmacion({
  result,
  onNext,
}: {
  result: CheckInResult;
  onNext: () => void;
}) {
  // Auto-reset para el siguiente alumno.
  useEffect(() => {
    const t = setTimeout(onNext, 8000);
    return () => clearTimeout(t);
  }, [onNext]);

  const requeridas = result.clases_requeridas;
  const pct =
    requeridas && requeridas > 0
      ? Math.min(Math.round((result.clases_contadas / requeridas) * 100), 100)
      : 100;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-green-600 text-3xl text-white">
        ✓
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
        Otro alumno
      </Button>
    </main>
  );
}
