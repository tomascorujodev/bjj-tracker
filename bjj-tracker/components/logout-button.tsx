import { logoutAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";

// Server component: form con server action. No necesita "use client".
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" size="sm">
        Salir
      </Button>
    </form>
  );
}
