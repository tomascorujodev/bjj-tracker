"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import type { ClassScheduleRow } from "@/lib/data/schedule";
import {
  createScheduleAction,
  updateScheduleAction,
  toggleScheduleAction,
  deleteScheduleAction,
} from "./actions";

const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

type Tipo = { id: string; nombre: string };

// Hora en formato HH:MM (00:00–23:59). Carga manual por teclado.
const TIME_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export function HorariosClient({
  schedule,
  tipos,
}: {
  schedule: ClassScheduleRow[];
  tipos: Tipo[];
}) {
  const nombreDe = (id: string) => tipos.find((t) => t.id === id)?.nombre ?? "—";
  const [selected, setSelected] = useState<ClassScheduleRow | null>(null);

  return (
    <div className="space-y-6">
      <WeeklyGrid
        schedule={schedule}
        nombreDe={nombreDe}
        onSelect={setSelected}
      />

      <AddForm tipos={tipos} />

      <Dialog
        open={selected !== null}
        onOpenChange={(o) => {
          if (!o) setSelected(null);
        }}
      >
        <DialogContent>
          {selected && (
            <EditForm
              key={selected.id}
              row={selected}
              tipos={tipos}
              nombre={nombreDe(selected.class_type_id)}
              onClose={() => setSelected(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Vista semanal: filas = horas de inicio, columnas = Lunes a Sábado.
const GRID_DIAS = [1, 2, 3, 4, 5, 6]; // sin domingo, como en la grilla del gym

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Dibuja la grilla semanal en un canvas (logo centrado arriba + tabla).
// No usa el DOM, así evita los colores oklch de Tailwind v4.
async function buildScheduleCanvas(
  activos: ClassScheduleRow[],
  horas: string[],
  nombreDe: (id: string) => string,
): Promise<HTMLCanvasElement | null> {
  const dias = GRID_DIAS;
  const scale = 2;
  const pad = 36;
  const W = 940;
  const timeColW = 84;
  const tableW = W - pad * 2;
  const dayColW = (tableW - timeColW) / dias.length;
  const headerH = 46;
  const rowH = 48;

  const logo = await loadImage("/images/climent-club-logo.png");
  const logoW = 300;
  const logoH = logo ? (logoW * logo.naturalHeight) / logo.naturalWidth : 44;
  const logoGap = 28;
  const tableTop = pad + logoH + logoGap;
  const tableH = headerH + horas.length * rowH;
  const H = tableTop + tableH + pad;

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(scale, scale);
  ctx.textBaseline = "middle";

  // Fondo blanco
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Logo centrado
  if (logo) ctx.drawImage(logo, (W - logoW) / 2, pad, logoW, logoH);

  const x0 = pad;
  const y0 = tableTop;

  // Header
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(x0, y0, tableW, headerH);
  ctx.fillStyle = "#0f172a";
  ctx.textAlign = "center";
  ctx.font = "600 14px system-ui, -apple-system, sans-serif";
  ctx.fillText("Hora", x0 + timeColW / 2, y0 + headerH / 2);
  dias.forEach((d, i) =>
    ctx.fillText(DIAS[d], x0 + timeColW + dayColW * (i + 0.5), y0 + headerH / 2),
  );

  // Filas
  horas.forEach((hora, ri) => {
    const ry = y0 + headerH + ri * rowH;
    ctx.fillStyle = "#64748b";
    ctx.font = "600 13px system-ui, -apple-system, sans-serif";
    ctx.fillText(hora.slice(0, 5), x0 + timeColW / 2, ry + rowH / 2);

    dias.forEach((d, ci) => {
      const names = activos
        .filter((s) => s.hora_inicio === hora && s.dia_semana === d)
        .map((s) => nombreDe(s.class_type_id));
      if (names.length === 0) return;
      const text = names.join(" / ");
      const cx = x0 + timeColW + dayColW * (ci + 0.5);
      const cy = ry + rowH / 2;
      ctx.font = "600 12.5px system-ui, -apple-system, sans-serif";
      const tw = ctx.measureText(text).width;
      const pillW = Math.min(dayColW - 12, tw + 22);
      const pillH = 26;
      roundRect(ctx, cx - pillW / 2, cy - pillH / 2, pillW, pillH, 7);
      ctx.fillStyle = "#e2e8f0";
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.fillText(text, cx, cy);
    });
  });

  // Líneas
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let r = 0; r <= horas.length; r++) {
    const yy = y0 + headerH + r * rowH;
    ctx.moveTo(x0, yy);
    ctx.lineTo(x0 + tableW, yy);
  }
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0 + tableW, y0);
  const verticals = [x0, x0 + timeColW];
  for (let i = 1; i <= dias.length; i++) verticals.push(x0 + timeColW + dayColW * i);
  verticals.forEach((vx) => {
    ctx.moveTo(vx, y0);
    ctx.lineTo(vx, y0 + tableH);
  });
  ctx.stroke();

  return canvas;
}

async function downloadScheduleImage(
  activos: ClassScheduleRow[],
  horas: string[],
  nombreDe: (id: string) => string,
) {
  const canvas = await buildScheduleCanvas(activos, horas, nombreDe);
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "horarios.png";
    a.click();
    URL.revokeObjectURL(url);
  });
}

function WeeklyGrid({
  schedule,
  nombreDe,
  onSelect,
}: {
  schedule: ClassScheduleRow[];
  nombreDe: (id: string) => string;
  onSelect: (row: ClassScheduleRow) => void;
}) {
  const activos = schedule.filter((s) => s.activo);
  const horas = [...new Set(activos.map((s) => s.hora_inicio))].sort();

  const clasesEn = (hora: string, dia: number) =>
    activos.filter((s) => s.hora_inicio === hora && s.dia_semana === dia);

  if (horas.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border p-6 text-center text-sm">
        Agregá horarios para ver la grilla semanal.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => downloadScheduleImage(activos, horas, nombreDe)}
        >
          <Download className="size-4" /> Descargar
        </Button>
      </div>
      <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Hora</TableHead>
            {GRID_DIAS.map((d) => (
              <TableHead key={d} className="text-center">
                {DIAS[d]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {horas.map((hora) => (
            <TableRow key={hora}>
              <TableCell className="text-muted-foreground font-medium">
                {hora.slice(0, 5)}
              </TableCell>
              {GRID_DIAS.map((dia) => {
                const clases = clasesEn(hora, dia);
                return (
                  <TableCell key={dia} className="text-center">
                    {clases.length > 0 ? (
                      <div className="flex flex-wrap justify-center gap-1">
                        {clases.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => onSelect(s)}
                            className="bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium transition-colors"
                          >
                            {nombreDe(s.class_type_id)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/40">·</span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}

function EditForm({
  row,
  tipos,
  nombre,
  onClose,
}: {
  row: ClassScheduleRow;
  tipos: Tipo[];
  nombre: string;
  onClose: () => void;
}) {
  const [typeId, setTypeId] = useState(row.class_type_id);
  const [dia, setDia] = useState(String(row.dia_semana));
  const [inicio, setInicio] = useState(row.hora_inicio.slice(0, 5));
  const [fin, setFin] = useState(row.hora_fin.slice(0, 5));
  const [activo, setActivo] = useState(row.activo);
  const [pending, startTransition] = useTransition();

  const ready = typeId && dia !== "" && TIME_RE.test(inicio) && TIME_RE.test(fin);

  function save() {
    startTransition(async () => {
      const res = await updateScheduleAction(row.id, {
        class_type_id: typeId,
        dia_semana: Number(dia),
        hora_inicio: inicio,
        hora_fin: fin,
      });
      if (res.ok) {
        toast.success("Horario actualizado");
        onClose();
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  function toggleActivo(next: boolean) {
    setActivo(next);
    startTransition(async () => {
      const res = await toggleScheduleAction(row.id, next);
      if (!res.ok) {
        setActivo(!next);
        toast.error(res.error ?? "Error");
      }
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar horario</DialogTitle>
        <DialogDescription>
          {nombre} · {DIAS[row.dia_semana]} {row.hora_inicio.slice(0, 5)}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Clase</Label>
          <Select value={typeId} onValueChange={(v) => setTypeId(v as string)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: unknown) =>
                  v ? (tipos.find((t) => t.id === v)?.nombre ?? "") : "Elegí la clase"
                }
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

        <div className="flex flex-col gap-1.5">
          <Label>Día</Label>
          <Select value={dia} onValueChange={(v) => setDia(v as string)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: unknown) =>
                  v !== "" && v != null ? DIAS[Number(v)] : "Elegí el día"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DIAS.map((d, i) => (
                <SelectItem key={i} value={String(i)}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-inicio">Inicio</Label>
          <Input
            id="edit-inicio"
            type="text"
            inputMode="numeric"
            placeholder="19:00"
            maxLength={5}
            pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-fin">Fin</Label>
          <Input
            id="edit-fin"
            type="text"
            inputMode="numeric"
            placeholder="20:30"
            maxLength={5}
            pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
            value={fin}
            onChange={(e) => setFin(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="edit-activo">Activo</Label>
        <Switch
          id="edit-activo"
          checked={activo}
          onCheckedChange={toggleActivo}
          disabled={pending}
        />
      </div>

      <DialogFooter className="sm:justify-between">
        <ConfirmDialog
          trigger={
            <Button variant="destructive" disabled={pending}>
              <Trash2 className="size-4" /> Eliminar
            </Button>
          }
          title="Eliminar horario"
          description={`¿Eliminar ${nombre} · ${DIAS[row.dia_semana]} ${row.hora_inicio.slice(0, 5)}? No se puede deshacer.`}
          onConfirm={async () => {
            const res = await deleteScheduleAction(row.id);
            if (res.ok) {
              toast.success("Horario eliminado");
              onClose();
            } else toast.error(res.error ?? "Error");
            return res.ok;
          }}
        />
        <Button onClick={save} disabled={pending || !ready}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </>
  );
}

function AddForm({ tipos }: { tipos: Tipo[] }) {
  const [typeId, setTypeId] = useState("");
  const [dia, setDia] = useState("");
  const [inicio, setInicio] = useState("19:00");
  const [fin, setFin] = useState("20:30");
  const [pending, startTransition] = useTransition();

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createScheduleAction({
        class_type_id: typeId,
        dia_semana: Number(dia),
        hora_inicio: inicio,
        hora_fin: fin,
      });
      if (res.ok) {
        toast.success("Horario agregado");
        setTypeId("");
        setDia("");
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  const ready =
    typeId && dia !== "" && TIME_RE.test(inicio) && TIME_RE.test(fin);

  return (
    <form
      onSubmit={add}
      className="bg-card grid grid-cols-2 items-end gap-4 rounded-xl border p-4 md:grid-cols-5"
    >
      <div className="flex flex-col gap-1.5">
        <Label>Clase</Label>
        <Select value={typeId} onValueChange={(v) => setTypeId(v as string)}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: unknown) =>
                v ? (tipos.find((t) => t.id === v)?.nombre ?? "") : "Elegí la clase"
              }
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

      <div className="flex flex-col gap-1.5">
        <Label>Día</Label>
        <Select value={dia} onValueChange={(v) => setDia(v as string)}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: unknown) =>
                v !== "" && v != null ? DIAS[Number(v)] : "Elegí el día"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DIAS.map((d, i) => (
              <SelectItem key={i} value={String(i)}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inicio">Inicio</Label>
        <Input
          id="inicio"
          type="text"
          inputMode="numeric"
          placeholder="19:00"
          maxLength={5}
          pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fin">Fin</Label>
        <Input
          id="fin"
          type="text"
          inputMode="numeric"
          placeholder="20:30"
          maxLength={5}
          pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={pending || !ready} className="col-span-2 md:col-span-1">
        Agregar
      </Button>
    </form>
  );
}
