import { requireRole } from "@/lib/auth";
import { CheckinClient } from "./checkin-client";

// Check-in del alumno logueado: escanea el QR de la academia con la cámara de su celu.
// El proxy ya exige sesión; acá revalidamos el rol.
export default async function CheckinPage() {
  await requireRole("alumno", "admin", "profesor");
  return <CheckinClient />;
}
