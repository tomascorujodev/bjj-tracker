"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/admin/alumnos", label: "Alumnos" },
  { href: "/admin/clases", label: "Tipos de clase" },
  { href: "/admin/horarios", label: "Horarios" },
  { href: "/admin/cinturones", label: "Cinturones" },
  { href: "/admin/eventos", label: "Eventos" },
  { href: "/admin/qr", label: "QR Academia" },
  { href: "/solicitudes", label: "Solicitudes" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {SECTIONS.map((s) => {
        const active = pathname === s.href || pathname.startsWith(s.href + "/");
        return (
          <Link
            key={s.href}
            href={s.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
              active
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
