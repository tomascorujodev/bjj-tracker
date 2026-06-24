"use server";

import { requireRole } from "@/lib/auth";
import {
  eligibleClassesNow,
  checkInScan,
  type EligibleOk,
  type EligibleErr,
  type CheckInOk,
  type CheckInErr,
} from "@/lib/data/checkin";

// El alumno logueado escanea el QR de la academia. Estas acciones exigen sesión.
// admin/profesor pueden abrir la pantalla, pero el check-in real necesita una
// ficha de alumno vinculada (lo valida checkInScan / la RPC).

export async function eligibleClassesAction(
  qrToken: string,
): Promise<EligibleOk | EligibleErr> {
  await requireRole("alumno", "admin", "profesor");
  const token = qrToken.trim();
  if (!token) return { ok: false, error: "QR vacío" };
  return eligibleClassesNow(token);
}

export async function checkInScanAction(
  qrToken: string,
  classTypeId: string,
): Promise<CheckInOk | CheckInErr> {
  await requireRole("alumno", "admin", "profesor");
  const token = qrToken.trim();
  if (!token) return { ok: false, error: "QR vacío" };
  if (!classTypeId) return { ok: false, error: "Elegí la clase." };
  return checkInScan(token, classTypeId);
}
