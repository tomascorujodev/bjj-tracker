import type { BeltColor } from "@/lib/supabase/types";

export const BELTS: BeltColor[] = ["blanco", "azul", "violeta", "marron", "negro"];

export const BELT_LABEL: Record<BeltColor, string> = {
  blanco: "Blanco",
  azul: "Azul",
  violeta: "Violeta",
  marron: "Marrón",
  negro: "Negro",
};

// Clases Tailwind para el chip de cinturón.
export const BELT_CLASS: Record<BeltColor, string> = {
  blanco: "bg-zinc-100 text-zinc-900 border-zinc-300",
  azul: "bg-blue-600 text-white border-blue-700",
  violeta: "bg-purple-600 text-white border-purple-700",
  marron: "bg-amber-800 text-white border-amber-900",
  negro: "bg-black text-white border-zinc-700",
};
