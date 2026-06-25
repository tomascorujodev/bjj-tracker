import Link from "next/link";
import Image from "next/image";
import { requireRole } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="no-print bg-background/80 sticky top-0 z-20 border-b backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
          <Link href="/admin" className="flex items-center gap-2.5 font-semibold">
            <Image
              src="/images/climent-club-logo.png"
              alt="Climent Club"
              width={200}
              height={28}
              priority
              className="h-7 w-auto"
            />
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="text-muted-foreground text-sm font-medium">Admin</span>
            <LogoutButton />
          </div>
        </div>
        <div className="mx-auto w-full max-w-5xl px-4 pb-1">
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
