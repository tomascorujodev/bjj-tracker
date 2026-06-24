import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function EventosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("alumno", "admin", "profesor");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="bg-background/80 sticky top-0 z-20 border-b backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-3.5">
          <Link href="/eventos" className="flex items-center gap-2.5 font-semibold">
            <span className="bg-muted text-foreground flex size-7 items-center justify-center rounded-md">
              <CalendarDays className="size-4" />
            </span>
            Eventos
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
