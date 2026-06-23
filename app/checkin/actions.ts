"use server";

import { checkIn, type CheckInOk, type CheckInErr } from "@/lib/data/checkin";

// Acción pública del kiosko (anon, sin login). La validación de token + DNI
// ocurre dentro de checkIn / la RPC check_in.
export async function checkInAction(
  academyToken: string,
  dni: string,
  classTypeId: string,
): Promise<CheckInOk | CheckInErr> {
  const clean = dni.trim();
  if (!/^\d{6,10}$/.test(clean))
    return { ok: false, error: "DNI inválido (6 a 10 dígitos)." };
  if (!classTypeId) return { ok: false, error: "Elegí el tipo de clase." };
  return checkIn(academyToken, clean, classTypeId);
}
