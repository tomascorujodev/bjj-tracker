import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next 16: "Middleware" se llama ahora Proxy. Corre antes de cada request.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Excluye assets estáticos e imágenes.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
