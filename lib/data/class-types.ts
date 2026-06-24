import { createClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/config";
import { mockClassTypes } from "@/lib/data/mock";

export type ClassTypeRow = {
  id: string;
  nombre: string;
  activo: boolean;
  cuenta_para_progreso: boolean;
};

export type ClassTypePatch = Partial<Omit<ClassTypeRow, "id">>;

export async function listClassTypes(): Promise<ClassTypeRow[]> {
  if (isMockMode()) {
    return [...mockClassTypes].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  const sb = await createClient();
  const { data, error } = await sb.from("class_types").select("*").order("nombre");
  if (error) throw new Error(error.message);
  return data;
}

export async function createClassType(nombre: string): Promise<void> {
  if (isMockMode()) {
    mockClassTypes.push({
      id: crypto.randomUUID(),
      nombre,
      activo: true,
      cuenta_para_progreso: true,
    });
    return;
  }
  const sb = await createClient();
  const { error } = await sb.from("class_types").insert({ nombre });
  if (error) throw new Error(error.message);
}

export async function updateClassType(
  id: string,
  patch: ClassTypePatch,
): Promise<void> {
  if (isMockMode()) {
    const c = mockClassTypes.find((x) => x.id === id);
    if (c) Object.assign(c, patch);
    return;
  }
  const sb = await createClient();
  const { error } = await sb.from("class_types").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteClassType(id: string): Promise<void> {
  if (isMockMode()) {
    const i = mockClassTypes.findIndex((x) => x.id === id);
    if (i >= 0) mockClassTypes.splice(i, 1);
    return;
  }
  const sb = await createClient();
  const { error } = await sb.from("class_types").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
