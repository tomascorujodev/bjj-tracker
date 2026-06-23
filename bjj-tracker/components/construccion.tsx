import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder mientras se construye cada vista.
export function Construccion({
  titulo,
  detalle,
}: {
  titulo: string;
  detalle?: string;
}) {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            En construcción.{detalle ? ` ${detalle}` : ""}
          </p>
          <Link href="/" className="text-sm underline">
            ← Volver al inicio
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
