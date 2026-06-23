import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/config";
import { mockBeltConfig } from "@/lib/data/mock";
import { BELTS } from "@/lib/belts";
import type { BeltColor } from "@/lib/supabase/types";

export type BeltConfigRow = {
  id: string;
  cinturon_desde: BeltColor;
  cinturon_hasta: BeltColor;
  clases_requeridas: number;
};

// Ordena los tramos según la secuencia de cinturones.
function byBeltOrder(a: BeltConfigRow, b: BeltConfigRow) {
  return BELTS.indexOf(a.cinturon_desde) - BELTS.indexOf(b.cinturon_desde);
}

export async function listBeltConfig(): Promise<BeltConfigRow[]> {
  if (isMockMode()) {
    return [...mockBeltConfig].sort(byBeltOrder);
  }
  const sb = await createClient();
  const { data, error } = await sb.from("belt_config").select("*");
  if (error) throw new Error(error.message);
  return [...data].sort(byBeltOrder);
}

export async function updateBeltRequired(
  id: string,
  clases_requeridas: number,
): Promise<void> {
  if (isMockMode()) {
    const b = mockBeltConfig.find((x) => x.id === id);
    if (b) b.clases_requeridas = clases_requeridas;
    return;
  }
  const sb = await createClient();
  const { error } = await sb
    .from("belt_config")
    .update({ clases_requeridas })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
