"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  setPagado,
  removeEnrollment,
  type EventInput,
} from "@/lib/data/events";

export type ActionResult = { ok: boolean; error?: string };

function parseEvent(formData: FormData): EventInput | string {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const fechaRaw = String(formData.get("fecha") ?? "").trim();
  const precioRaw = String(formData.get("precio") ?? "").trim();
  const cupoRaw = String(formData.get("cupo") ?? "").trim();

  if (!titulo) return "El título es obligatorio.";
  if (!fechaRaw || Number.isNaN(Date.parse(fechaRaw)))
    return "Fecha y hora inválidas.";

  const precio = precioRaw === "" ? 0 : Number(precioRaw);
  if (Number.isNaN(precio) || precio < 0) return "Precio inválido.";

  let cupo: number | null = null;
  if (cupoRaw !== "") {
    cupo = Number(cupoRaw);
    if (!Number.isInteger(cupo) || cupo < 1) return "Cupo inválido.";
  }

  return {
    titulo,
    descripcion: descripcion || null,
    fecha: new Date(fechaRaw).toISOString(),
    precio,
    cupo,
  };
}

export async function createEventAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = parseEvent(formData);
  if (typeof parsed === "string") return { ok: false, error: parsed };
  try {
    await createEvent(parsed);
    revalidatePath("/admin/eventos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateEventAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = parseEvent(formData);
  if (typeof parsed === "string") return { ok: false, error: parsed };
  try {
    await updateEvent(id, parsed);
    revalidatePath("/admin/eventos");
    revalidatePath(`/admin/eventos/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  await requireRole("admin");
  try {
    await deleteEvent(id);
    revalidatePath("/admin/eventos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setPagadoAction(
  eventId: string,
  enrollmentId: string,
  pagado: boolean,
): Promise<ActionResult> {
  await requireRole("admin", "profesor");
  try {
    await setPagado(enrollmentId, pagado);
    revalidatePath(`/admin/eventos/${eventId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function removeEnrollmentAction(
  eventId: string,
  enrollmentId: string,
): Promise<ActionResult> {
  await requireRole("admin", "profesor");
  try {
    await removeEnrollment(enrollmentId);
    revalidatePath(`/admin/eventos/${eventId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
