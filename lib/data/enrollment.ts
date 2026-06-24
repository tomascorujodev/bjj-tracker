import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/config";
import { mockPendingRequests, mockStudents } from "@/lib/data/mock";

// Una solicitud de ingreso: cuenta de alumno registrada, esperando aprobación.
export type PendingRequest = {
  id: string; // id del usuario (auth)
  email: string;
  nombre: string | null;
  dni: string | null;
};

export async function listPendingRequests(): Promise<PendingRequest[]> {
  if (isMockMode()) {
    return [...mockPendingRequests].sort((a, b) =>
      (a.nombre ?? a.email).localeCompare(b.nombre ?? b.email),
    );
  }
  const sb = await createClient();
  const { data, error } = await sb.rpc("list_pending_users");
  if (error) throw new Error(error.message);
  return (data as PendingRequest[]) ?? [];
}

// Acepta la solicitud: crea/vincula la ficha y activa la cuenta.
export async function approveRequest(userId: string): Promise<void> {
  if (isMockMode()) {
    const i = mockPendingRequests.findIndex((r) => r.id === userId);
    if (i < 0) return;
    const req = mockPendingRequests[i];
    const existing = req.dni
      ? mockStudents.find((s) => s.dni === req.dni)
      : undefined;
    if (existing) {
      // Vincula a la ficha pre-existente y refleja el nombre del registro.
      if (req.nombre) existing.nombre = req.nombre;
    } else {
      mockStudents.push({
        id: crypto.randomUUID(),
        dni: req.dni ?? `SIN-DNI-${userId.slice(0, 8)}`,
        nombre: req.nombre ?? "Alumno",
        foto_url: null,
        cinturon_actual: "blanco",
        fecha_inicio: new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString(),
      });
    }
    mockPendingRequests.splice(i, 1);
    return;
  }
  const sb = await createClient();
  const { error } = await sb.rpc("approve_user", { p_user_id: userId });
  if (error) throw new Error(error.message);
}

export async function rejectRequest(userId: string): Promise<void> {
  if (isMockMode()) {
    const i = mockPendingRequests.findIndex((r) => r.id === userId);
    if (i >= 0) mockPendingRequests.splice(i, 1);
    return;
  }
  const sb = await createClient();
  const { error } = await sb.rpc("reject_user", { p_user_id: userId });
  if (error) throw new Error(error.message);
}
