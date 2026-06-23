import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/config";
import { mockAcademy } from "@/lib/data/mock";

export type AcademyRow = {
  id: string;
  nombre: string;
  qr_token: string;
  created_at: string;
};

// MVP: una sola academia. Devuelve la primera.
export async function getAcademy(): Promise<AcademyRow | null> {
  if (isMockMode()) {
    return mockAcademy;
  }
  const sb = await createClient();
  const { data, error } = await sb
    .from("academies")
    .select("*")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function regenerateQrToken(id: string): Promise<string> {
  const token = crypto.randomUUID();
  if (isMockMode()) {
    mockAcademy.qr_token = token;
    return token;
  }
  const sb = await createClient();
  const { error } = await sb
    .from("academies")
    .update({ qr_token: token })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return token;
}
