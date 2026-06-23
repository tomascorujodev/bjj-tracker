import { headers } from "next/headers";
import QRCode from "qrcode";
import { getAcademy } from "@/lib/data/academy";
import { isMockMode } from "@/lib/config";
import { QrClient } from "./qr-client";

export default async function QrPage() {
  const academy = await getAcademy();

  if (!academy) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">QR de la academia</h1>
        <p className="text-muted-foreground text-sm">
          No hay academia cargada. Corré el seed o creá una.
        </p>
      </div>
    );
  }

  // Origen público para la URL del kiosko.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const checkinUrl = `${proto}://${host}/checkin?academy=${academy.qr_token}`;

  const qrDataUrl = await QRCode.toDataURL(checkinUrl, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-2xl font-semibold">QR de la academia</h1>
        <p className="text-muted-foreground text-sm">
          Imprimí este QR y pegalo en la entrada. Los alumnos lo escanean para
          hacer check-in.
          {isMockMode() ? " · datos de prueba (sin Supabase)" : ""}
        </p>
      </div>
      <QrClient
        academyId={academy.id}
        academyName={academy.nombre}
        qrToken={academy.qr_token}
        qrDataUrl={qrDataUrl}
        checkinUrl={checkinUrl}
      />
    </div>
  );
}
