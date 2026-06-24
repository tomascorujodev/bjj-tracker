import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { devBypassRole } from "@/lib/config";
import type { Database } from "./types";

// Rutas protegidas y el rol que admiten. Solo / y /login son públicas.
const ROUTE_ROLES: Record<string, ReadonlyArray<string>> = {
  "/admin": ["admin"],
  "/profesor": ["admin", "profesor"],
  "/alumno": ["alumno", "admin", "profesor"],
  "/eventos": ["alumno", "admin", "profesor"],
  "/checkin": ["alumno", "admin", "profesor"],
  "/solicitudes": ["admin", "profesor"],
  "/pendiente": ["alumno", "admin", "profesor"],
  "/cambiar-password": ["alumno", "admin", "profesor"],
};

// Inactividad: si pasan más de 14 días sin abrir la app, se cierra la sesión.
// Con uso diario la ventana se renueva sola (sliding) y nunca pide login de nuevo.
const INACTIVITY_MS = 14 * 24 * 60 * 60 * 1000;
const ACTIVITY_COOKIE = "bjj-last-activity";
// La cookie vive más que la ventana para poder detectar el vencimiento al volver.
const ACTIVITY_MAXAGE = 30 * 24 * 60 * 60;

// Refresca la sesión de Supabase y hace una verificación optimista de rol.
// La autorización real se valida de nuevo en cada Server Component / Action.
export async function updateSession(request: NextRequest) {
  // Bypass de desarrollo: salta el gating por completo.
  const bypass = devBypassRole();
  if (bypass) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Cierre por inactividad (sliding window). Solo aplica con sesión activa.
  if (user) {
    const last = request.cookies.get(ACTIVITY_COOKIE)?.value;
    const now = Date.now();
    if (last && now - Number(last) > INACTIVITY_MS) {
      // Vencida: limpiar cookies de sesión de Supabase + la de actividad y mandar a login.
      const redir = NextResponse.redirect(new URL("/login", request.url));
      redir.cookies.set(ACTIVITY_COOKIE, "", { path: "/", maxAge: 0 });
      for (const c of request.cookies.getAll()) {
        if (c.name.startsWith("sb-"))
          redir.cookies.set(c.name, "", { path: "/", maxAge: 0 });
      }
      return redir;
    }
    // Renovar la marca de actividad.
    response.cookies.set(ACTIVITY_COOKIE, String(now), {
      path: "/",
      maxAge: ACTIVITY_MAXAGE,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  const path = request.nextUrl.pathname;
  const match = Object.keys(ROUTE_ROLES).find((p) => path.startsWith(p));

  if (match) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("users")
      .select("rol")
      .eq("id", user.id)
      .single();

    const allowed = ROUTE_ROLES[match];
    if (!profile || !allowed.includes(profile.rol)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
