-- BJJ Tracker — Vistas y funciones

-- ─────────────────────────────────────────────────────────────
-- v_student_progress — progreso de cada alumno hacia el siguiente cinturón.
--
-- Simplificación MVP: clases_contadas = total histórico de asistencias a class_types
-- con cuenta_para_progreso = true. No hay tabla de historial de promociones, así que
-- el conteo no se reinicia al subir de cinturón. Refinar cuando exista ese historial.
-- ─────────────────────────────────────────────────────────────
create or replace view public.v_student_progress
with (security_invoker = true) as
select
  s.id                                       as student_id,
  s.nombre,
  s.cinturon_actual,
  bc.cinturon_hasta                          as cinturon_siguiente,
  coalesce(cnt.clases_contadas, 0)           as clases_contadas,
  bc.clases_requeridas,
  greatest(coalesce(bc.clases_requeridas, 0) - coalesce(cnt.clases_contadas, 0), 0) as clases_faltantes
from public.students s
left join public.belt_config bc
  on bc.cinturon_desde = s.cinturon_actual
left join (
  select a.student_id, count(*)::int as clases_contadas
  from public.attendance a
  join public.class_types ct on ct.id = a.class_type_id
  where ct.cuenta_para_progreso
  group by a.student_id
) cnt on cnt.student_id = s.id;

-- ─────────────────────────────────────────────────────────────
-- check_in — registro de asistencia desde el kiosko público (anon).
-- Valida qr_token de la academia y dni del alumno antes de insertar.
-- SECURITY DEFINER: corre con permisos del owner, esquiva RLS de attendance.
-- ─────────────────────────────────────────────────────────────
create or replace function public.check_in(
  p_qr_token      uuid,
  p_dni           text,
  p_class_type_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_academy_id uuid;
  v_student    public.students%rowtype;
  v_class_ok   boolean;
  v_progress   record;
begin
  -- Academia válida por qr_token
  select id into v_academy_id from public.academies where qr_token = p_qr_token;
  if v_academy_id is null then
    raise exception 'QR de academia inválido' using errcode = 'P0001';
  end if;

  -- Alumno por DNI
  select * into v_student from public.students where dni = p_dni;
  if v_student.id is null then
    raise exception 'DNI no encontrado' using errcode = 'P0002';
  end if;

  -- Tipo de clase activo
  select activo into v_class_ok from public.class_types where id = p_class_type_id;
  if v_class_ok is distinct from true then
    raise exception 'Tipo de clase inválido o inactivo' using errcode = 'P0003';
  end if;

  -- Registrar asistencia (auto check-in: registrado_por = NULL)
  insert into public.attendance (student_id, class_type_id)
  values (v_student.id, p_class_type_id);

  -- Progreso actualizado
  select * into v_progress from public.v_student_progress where student_id = v_student.id;

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

-- El kiosko usa la anon key: dejar que anon ejecute SOLO esta función.
grant execute on function public.check_in(uuid, text, uuid) to anon;

-- ─────────────────────────────────────────────────────────────
-- academy_by_token — valida el qr_token y devuelve datos públicos de la academia.
-- Permite que el kiosko muestre el nombre y confirme que el QR es válido,
-- sin exponer SELECT directo sobre academies.
-- ─────────────────────────────────────────────────────────────
create or replace function public.academy_by_token(p_qr_token uuid)
returns table (id uuid, nombre text)
language sql
security definer
set search_path = public
as $$
  select a.id, a.nombre from public.academies a where a.qr_token = p_qr_token;
$$;

grant execute on function public.academy_by_token(uuid) to anon;
