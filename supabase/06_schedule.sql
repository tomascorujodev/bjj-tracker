-- BJJ Tracker — Horarios de clases + check-in por escaneo (alumno logueado)
-- Ejecutar después de 01..05.
--
-- Cambio de modelo: el kiosko anónimo (QR de academia + tipear DNI) se reemplaza por
-- el escaneo del QR desde el celular del ALUMNO LOGUEADO. El sistema sabe quién es por
-- la sesión (my_student_id()) y qué clase es por la hora + esta grilla de horarios.
--
-- Regla de ventana: se puede acreditar desde 30 min antes del inicio y hasta la hora de
-- inicio exacta. Si la clase ya empezó, no se puede (el profe lo carga a mano).
-- Zona horaria: America/Argentina/Buenos_Aires (Supabase corre en UTC).

-- ─────────────────────────────────────────────────────────────
-- class_schedule — grilla semanal recurrente.
--   dia_semana: 0=domingo .. 6=sábado (igual que extract(dow) de Postgres y Date.getDay() de JS).
-- ─────────────────────────────────────────────────────────────
create table if not exists public.class_schedule (
  id            uuid primary key default gen_random_uuid(),
  class_type_id uuid not null references public.class_types(id) on delete cascade,
  dia_semana    smallint not null check (dia_semana between 0 and 6),
  hora_inicio   time not null,
  hora_fin      time not null,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  check (hora_fin > hora_inicio)
);

create index if not exists class_schedule_dia_idx on public.class_schedule(dia_semana);
create index if not exists class_schedule_type_idx on public.class_schedule(class_type_id);

alter table public.class_schedule enable row level security;

-- Lectura: cualquier autenticado (el alumno necesita ver/elegir). Escritura: solo admin.
drop policy if exists class_schedule_select on public.class_schedule;
create policy class_schedule_select on public.class_schedule
  for select to authenticated using (true);

drop policy if exists class_schedule_admin_all on public.class_schedule;
create policy class_schedule_admin_all on public.class_schedule
  for all to authenticated
  using (public.current_rol() = 'admin')
  with check (public.current_rol() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- eligible_classes_now — clases vigentes para check-in en este momento.
-- Devuelve las clases cuyo horario de hoy está dentro de la ventana [inicio-30min, inicio].
-- El cliente decide: 0 -> "no hay clase ahora"; 1 -> auto; varias -> que el alumno elija.
-- ─────────────────────────────────────────────────────────────
create or replace function public.eligible_classes_now(p_qr_token uuid)
returns table (id uuid, nombre text, hora_inicio time)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_now  timestamp;
  v_dow  smallint;
  v_time time;
  v_open interval := interval '30 minutes';
begin
  if not exists (select 1 from public.academies where qr_token = p_qr_token) then
    raise exception 'QR de academia inválido' using errcode = 'P0001';
  end if;

  v_now  := (now() at time zone 'America/Argentina/Buenos_Aires');
  v_dow  := extract(dow from v_now)::smallint;
  v_time := v_now::time;

  return query
  select s.class_type_id, ct.nombre, s.hora_inicio
  from public.class_schedule s
  join public.class_types ct on ct.id = s.class_type_id
  where s.activo
    and ct.activo
    and s.dia_semana = v_dow
    and v_time >= (s.hora_inicio - v_open)
    and v_time <= s.hora_inicio
  order by s.hora_inicio;
end;
$$;

grant execute on function public.eligible_classes_now(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- check_in_scan — registra la asistencia del alumno logueado tras escanear el QR.
-- Resuelve el alumno por la sesión, REVALIDA la ventana horaria server-side (anti-trampa),
-- bloquea duplicado del día y devuelve el progreso (mismo shape que el viejo check_in).
-- SECURITY DEFINER: esquiva la RLS de attendance (el alumno no puede insertar directo).
-- ─────────────────────────────────────────────────────────────
create or replace function public.check_in_scan(
  p_qr_token      uuid,
  p_class_type_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_student    public.students%rowtype;
  v_now    timestamp;
  v_dow    smallint;
  v_time   time;
  v_fecha  date;
  v_open   interval := interval '30 minutes';
  v_ok     boolean;
  v_progress record;
begin
  if not exists (select 1 from public.academies where qr_token = p_qr_token) then
    raise exception 'QR de academia inválido' using errcode = 'P0001';
  end if;

  v_student_id := public.my_student_id();
  if v_student_id is null then
    raise exception 'Tu usuario no está vinculado a una ficha de alumno' using errcode = 'P0002';
  end if;
  select * into v_student from public.students where id = v_student_id;

  v_now   := (now() at time zone 'America/Argentina/Buenos_Aires');
  v_dow   := extract(dow from v_now)::smallint;
  v_time  := v_now::time;
  v_fecha := v_now::date;

  -- Revalida que la clase elegida esté dentro de la ventana AHORA.
  select exists (
    select 1
    from public.class_schedule s
    join public.class_types ct on ct.id = s.class_type_id
    where s.class_type_id = p_class_type_id
      and s.activo and ct.activo
      and s.dia_semana = v_dow
      and v_time >= (s.hora_inicio - v_open)
      and v_time <= s.hora_inicio
  ) into v_ok;
  if not v_ok then
    raise exception 'Esa clase no está disponible para check-in en este momento' using errcode = 'P0003';
  end if;

  -- Duplicado del día (mismo alumno, mismo tipo, misma fecha).
  if exists (
    select 1 from public.attendance
    where student_id = v_student_id
      and class_type_id = p_class_type_id
      and fecha = v_fecha
  ) then
    raise exception 'Ya registraste tu asistencia a esta clase hoy' using errcode = 'P0004';
  end if;

  insert into public.attendance (student_id, class_type_id, fecha, hora)
  values (v_student_id, p_class_type_id, v_fecha, v_time);

  select * into v_progress from public.v_student_progress where student_id = v_student_id;

  return jsonb_build_object(
    'student_id',         v_student.id,
    'nombre',             v_student.nombre,
    'foto_url',           v_student.foto_url,
    'cinturon_actual',    v_student.cinturon_actual,
    'cinturon_siguiente', v_progress.cinturon_siguiente,
    'clases_contadas',    v_progress.clases_contadas,
    'clases_requeridas',  v_progress.clases_requeridas,
    'clases_faltantes',   v_progress.clases_faltantes
  );
end;
$$;

grant execute on function public.check_in_scan(uuid, uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Baja del kiosko anónimo viejo.
-- El check-in ya no es anónimo: revocar lo que tenía permiso anon y cerrar la
-- lectura pública de class_types (ahora solo autenticados la leen).
-- ─────────────────────────────────────────────────────────────
revoke execute on function public.check_in(uuid, text, uuid)  from anon;
revoke execute on function public.academy_by_token(uuid)      from anon;

drop policy if exists class_types_select on public.class_types;
create policy class_types_select on public.class_types
  for select to authenticated using (true);
