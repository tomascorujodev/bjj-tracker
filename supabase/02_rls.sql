-- BJJ Tracker — Row Level Security
-- Modelo: admin/profesor manejan todo; alumno ve solo lo suyo; check-in público va por RPC (03_functions.sql), no escribe directo.

-- ─────────────────────────────────────────────────────────────
-- Helpers (en schema public; SECURITY DEFINER para leer public.users sin recursión de RLS)
-- ─────────────────────────────────────────────────────────────
create or replace function public.current_rol()
returns user_rol
language sql stable security definer set search_path = public
as $$ select rol from public.users where id = auth.uid() $$;

create or replace function public.my_student_id()
returns uuid
language sql stable security definer set search_path = public
as $$ select student_id from public.users where id = auth.uid() $$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.current_rol() in ('admin','profesor'), false) $$;

-- ─────────────────────────────────────────────────────────────
-- Habilitar RLS
-- ─────────────────────────────────────────────────────────────
alter table public.academies  enable row level security;
alter table public.students   enable row level security;
alter table public.belt_config enable row level security;
alter table public.class_types enable row level security;
alter table public.attendance enable row level security;
alter table public.users      enable row level security;

-- ─────────────────────────────────────────────────────────────
-- academies — staff lee; solo admin escribe. (El qr_token público se resuelve por RPC, no por SELECT anon.)
-- ─────────────────────────────────────────────────────────────
drop policy if exists academies_select on public.academies;
create policy academies_select on public.academies
  for select to authenticated using (public.is_staff());

drop policy if exists academies_admin_all on public.academies;
create policy academies_admin_all on public.academies
  for all to authenticated
  using (public.current_rol() = 'admin')
  with check (public.current_rol() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- students — staff full; alumno ve solo su ficha.
-- ─────────────────────────────────────────────────────────────
drop policy if exists students_staff_all on public.students;
create policy students_staff_all on public.students
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists students_self_select on public.students;
create policy students_self_select on public.students
  for select to authenticated
  using (id = public.my_student_id());

-- ─────────────────────────────────────────────────────────────
-- belt_config / class_types — autenticados leen; solo admin escribe.
-- ─────────────────────────────────────────────────────────────
drop policy if exists belt_config_select on public.belt_config;
create policy belt_config_select on public.belt_config
  for select to authenticated using (true);

drop policy if exists belt_config_admin_all on public.belt_config;
create policy belt_config_admin_all on public.belt_config
  for all to authenticated
  using (public.current_rol() = 'admin')
  with check (public.current_rol() = 'admin');

-- class_types: lectura pública (el kiosko anónimo necesita mostrar los tipos activos).
-- Solo nombres, no hay datos sensibles.
drop policy if exists class_types_select on public.class_types;
create policy class_types_select on public.class_types
  for select to anon, authenticated using (true);

drop policy if exists class_types_admin_all on public.class_types;
create policy class_types_admin_all on public.class_types
  for all to authenticated
  using (public.current_rol() = 'admin')
  with check (public.current_rol() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- attendance — staff full (cargar/corregir); alumno ve solo lo suyo.
-- El kiosko anónimo NO inserta acá: usa la RPC check_in (SECURITY DEFINER).
-- ─────────────────────────────────────────────────────────────
drop policy if exists attendance_staff_all on public.attendance;
create policy attendance_staff_all on public.attendance
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists attendance_self_select on public.attendance;
create policy attendance_self_select on public.attendance
  for select to authenticated
  using (student_id = public.my_student_id());

-- ─────────────────────────────────────────────────────────────
-- users — cada uno ve su fila; admin ve/maneja todas.
-- ─────────────────────────────────────────────────────────────
drop policy if exists users_self_select on public.users;
create policy users_self_select on public.users
  for select to authenticated
  using (id = auth.uid() or public.current_rol() = 'admin');

drop policy if exists users_admin_all on public.users;
create policy users_admin_all on public.users
  for all to authenticated
  using (public.current_rol() = 'admin')
  with check (public.current_rol() = 'admin');
