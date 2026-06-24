-- BJJ Tracker — Auto-registro de alumnos + aprobación del staff
-- Ejecutar después de 01..06.
--
-- Flujo: el alumno se registra solo (email+pass+nombre+DNI). Queda en estado
-- 'pendiente'. Un profesor o admin lo acepta desde el panel de Solicitudes; ahí se
-- crea (o vincula por DNI) su ficha en students y pasa a 'activo'. Recién entonces
-- puede usar el portal, escanear el QR, etc.

-- ─────────────────────────────────────────────────────────────
-- estado de la cuenta + datos enviados en el registro
-- ─────────────────────────────────────────────────────────────
do $$ begin
  create type user_estado as enum ('pendiente', 'activo', 'rechazado');
exception when duplicate_object then null; end $$;

alter table public.users add column if not exists estado user_estado not null default 'pendiente';
alter table public.users add column if not exists nombre text;  -- nombre enviado al registrarse
alter table public.users add column if not exists dni    text;  -- DNI enviado al registrarse

-- Las cuentas que ya existían (admin/profesor sembrados) quedan activas.
update public.users set estado = 'activo' where estado = 'pendiente';

-- ─────────────────────────────────────────────────────────────
-- handle_new_user — al crear un usuario en Auth, crea su fila en public.users
-- como alumno PENDIENTE, copiando nombre/DNI del metadata del signup.
-- (Para crear un admin/profesor: registrarse y luego promover a mano con UPDATE.)
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, rol, estado, nombre, dni)
  values (
    new.id,
    new.email,
    'alumno',
    'pendiente',
    nullif(new.raw_user_meta_data->>'nombre', ''),
    nullif(new.raw_user_meta_data->>'dni', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- list_pending_users — solicitudes pendientes (solo staff las ve).
-- SECURITY DEFINER: la RLS de users no deja al profesor leer filas ajenas.
-- ─────────────────────────────────────────────────────────────
create or replace function public.list_pending_users()
returns table (id uuid, email text, nombre text, dni text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.email, u.nombre, u.dni
  from public.users u
  where u.estado = 'pendiente'
    and public.is_staff()
  order by u.nombre nulls last, u.email;
$$;

grant execute on function public.list_pending_users() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- approve_user — el staff acepta a un alumno: crea/vincula su ficha y lo activa.
-- Vincula por DNI si ya existe una ficha; si no, la crea (cinturón blanco, fecha hoy).
-- ─────────────────────────────────────────────────────────────
create or replace function public.approve_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user       public.users%rowtype;
  v_student_id uuid;
begin
  if not public.is_staff() then
    raise exception 'No autorizado' using errcode = 'P0001';
  end if;

  select * into v_user from public.users where id = p_user_id;
  if v_user.id is null then
    raise exception 'Usuario no encontrado' using errcode = 'P0002';
  end if;
  if v_user.estado <> 'pendiente' then
    raise exception 'La solicitud ya fue procesada' using errcode = 'P0003';
  end if;

  v_student_id := v_user.student_id;

  -- ¿Ya hay una ficha con ese DNI? Vincular.
  if v_student_id is null and v_user.dni is not null then
    select id into v_student_id from public.students where dni = v_user.dni;
  end if;

  -- Si no hay ficha, crearla.
  if v_student_id is null then
    insert into public.students (dni, nombre)
    values (
      coalesce(v_user.dni, 'SIN-DNI-' || left(p_user_id::text, 8)),
      coalesce(v_user.nombre, 'Alumno')
    )
    returning id into v_student_id;
  end if;

  -- Reflejar en la ficha el nombre que cargó el alumno al registrarse
  -- (incluido el caso en que se vinculó a una ficha pre-existente por DNI).
  if v_user.nombre is not null then
    update public.students set nombre = v_user.nombre where id = v_student_id;
  end if;

  update public.users
  set student_id = v_student_id, estado = 'activo'
  where id = p_user_id;
end;
$$;

grant execute on function public.approve_user(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- reject_user — el staff rechaza una solicitud.
-- ─────────────────────────────────────────────────────────────
create or replace function public.reject_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'No autorizado' using errcode = 'P0001';
  end if;
  update public.users set estado = 'rechazado'
  where id = p_user_id and estado = 'pendiente';
end;
$$;

grant execute on function public.reject_user(uuid) to authenticated;
