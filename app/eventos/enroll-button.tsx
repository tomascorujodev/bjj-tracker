"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { enrollAction } from "./actions";

export type EnrollStatus = "none" | "enrolled" | "paid";

export function EnrollButton({
  eventId,
  status: initial,
  full,
  className,
}: {
  eventId: string;
  status: EnrollStatus;
  full?: boolean;
  className?: string;
}) {
  const [status, setStatus] = useState<EnrollStatus>(initial);
  const [pending, startTransition] = useTransition();

  if (status === "paid") {
    return (
      <span
        className={cn(
          "text-chart-3 inline-flex items-center gap-1.5 text-sm font-medium",
          className,
        )}
      >
        <Check className="size-4" /> Anotado · pagado
      </span>
    );
  }

  if (status === "enrolled") {
    return (
      <span
        className={cn(
          "text-muted-foreground inline-flex items-center gap-1.5 text-sm font-medium",
          className,
        )}
      >
        <Clock className="size-4" /> Anotado · falta pagar
      </span>
    );
  }

  if (full) {
    return (
      <span className={cn("text-destructive text-sm font-medium", className)}>
        Cupo completo
      </span>
    );
  }

  function enroll() {
    startTransition(async () => {
      const res = await enrollAction(eventId);
      if (res.ok) {
        setStatus("enrolled");
        toast.success(res.already ? "Ya estabas anotado" : "¡Anotado!");
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  return (
    <Button onClick={enroll} disabled={pending} className={className}>
      {pending ? "Anotando…" : "Anotarme"}
    </Button>
  );
}
