-- BJJ Tracker — Eventos (seminarios, juntadas, etc.)
-- Ejecutar después de 01..04. El admin crea eventos; los alumnos logueados se
-- anotan vía la RPC enroll_event; el staff marca el pago (pagado sí/no).

-- ─────────────────────────────────────────────────────────────
-- events
--   precio: costo del evento (0 = gratis).
--   cupo:   límite de inscriptos. NULL = sin límite.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text,
  fecha       timestamptz not null,
  precio      numeric(10,2) not null default 0 check (precio >= 0),
  cupo        int check (cupo is null or cupo > 0),
  created_at  timestamptz not null default now()
);

create index if not exists events_fecha_idx on public.events(fecha);

-- ─────────────────────────────────────────────────────────────
-- event_enrollments — un alumno anotado a un evento.
--   pagado: lo togglea el staff cuando el alumno abona.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.event_enrollments (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  student_id  uuid not null references public.students(id) on delete cascade,
  pagado      boolean not null default false,
  pagado_at   timestamptz,
  created_at  timestamptz not null default now(),
  unique (event_id, student_id)
);

create index if not exists event_enrollments_event_idx on public.event_enrollments(event_id);
create index if not exists event_enrollments_student_idx on public.event_enrollments(student_id);

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table public.events            enable row level security;
alter table public.event_enrollments enable row level security;

-- events: cualquier autenticado los ve (los alumnos necesitan verlos para anotarse).
-- Solo admin escribe.
drop policy if exists events_select on public.events;
create policy events_select on public.events
  for select to authenticated using (true);

drop policy if exists events_admin_all on public.events;
create policy events_admin_all on public.events
  for all to authenticated
  using (public.current_rol() = 'admin')
  with check (public.current_rol() = 'admin');

-- event_enrollments: staff maneja todo (incluido togglear pagado);
-- el alumno ve solo sus inscripciones. El alta del alumno va por la RPC enroll_event.
drop policy if exists enrollments_staff_all on public.event_enrollments;
create policy enrollments_staff_all on public.event_enrollments
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists enrollments_self_select on public.event_enrollments;
create policy enrollments_self_select on public.event_enrollments
  for select to authenticated
  using (student_id = public.my_student_id());

-- ─────────────────────────────────────────────────────────────
-- enroll_event — el alumno logueado se anota a un evento.
-- Resuelve su ficha por auth.uid(), valida cupo y duplicados.
-- SECURITY DEFINER: esquiva la RLS de event_enrollments (que bloquea el INSERT del alumno).
-- ─────────────────────────────────────────────────────────────
create or replace function public.enroll_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_event      public.events%rowtype;
  v_count      int;
  v_existing   public.event_enrollments%rowtype;
begin
  v_student_id := public.my_student_id();
  if v_student_id is null then
    raise exception 'No estás vinculado a una ficha de alumno' using errcode = 'P0001';
  end if;

  select * into v_event from public.events where id = p_event_id;
  if v_event.id is null then
    raise exception 'Evento no encontrado' using errcode = 'P0002';
  end if;

  -- ¿Ya estaba anotado?
  select * into v_existing
  from public.event_enrollments
  where event_id = p_event_id and student_id = v_student_id;
  if v_existing.id is not null then
    return jsonb_build_object('already', true, 'pagado', v_existing.pagado, 'titulo', v_event.titulo);
  end if;

  -- Cupo
  if v_event.cupo is not null then
    select count(*) into v_count from public.event_enrollments where event_id = p_event_id;
    if v_count >= v_event.cupo then
      raise exception 'Cupo completo' using errcode = 'P0003';
    end if;
  end if;

  insert into public.event_enrollments (event_id, student_id)
  values (p_event_id, v_student_id);

  return jsonb_build_object('already', false, 'pagado', false, 'titulo', v_event.titulo);
end;
$$;

grant execute on function public.enroll_event(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- event_enrollment_counts — inscriptos por evento, visible a cualquier autenticado.
-- La RLS de event_enrollments limita al alumno a ver solo sus filas, así que no
-- puede contar el total. Esta RPC SECURITY DEFINER devuelve solo el conteo (sin datos
-- de quién), suficiente para mostrar cupo lleno.
-- ─────────────────────────────────────────────────────────────
create or replace function public.event_enrollment_counts()
returns table (event_id uuid, inscriptos int)
language sql
stable
security definer
set search_path = public
as $$
  select event_id, count(*)::int from public.event_enrollments group by event_id;
$$;

grant execute on function public.event_enrollment_counts() to authenticated;
