-- BJJ Tracker — Alta de profesores por el admin + cambio de contraseña obligatorio
-- Ejecutar después de 01..07.
--
-- El admin (dueño) crea profesores desde /admin/profesores: carga email + documento.
-- El backend usa la Admin API (service_role) para crear la cuenta con el documento como
-- contraseña temporal. Al primer ingreso el sistema obliga a cambiarla.

-- Marca de "debe cambiar la contraseña" (primer ingreso con contraseña temporal).
alter table public.users
  add column if not exists must_change_password boolean not null default false;

-- ─────────────────────────────────────────────────────────────
-- mark_password_changed — el propio usuario baja su flag tras cambiar la contraseña.
-- (La RLS de users no deja al usuario escribir su fila; por eso va por RPC definer.)
-- ─────────────────────────────────────────────────────────────
create or replace function public.mark_password_changed()
returns void
language sql
security definer
set search_path = public
as $$
  update public.users set must_change_password = false where id = auth.uid();
$$;

grant execute on function public.mark_password_changed() to authenticated;
