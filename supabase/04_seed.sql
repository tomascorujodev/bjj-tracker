-- BJJ Tracker — Seed inicial

-- Academia única (MVP). Guardá el qr_token: va en la URL del kiosko /checkin?academy=<qr_token>.
insert into public.academies (nombre)
values ('Academia Principal')
on conflict do nothing;

-- Tipos de clase. Gi/No-Gi cuentan para progreso; Kids/Competición no.
insert into public.class_types (nombre, activo, cuenta_para_progreso) values
  ('Gi',          true, true),
  ('No-Gi',       true, true),
  ('Kids',        true, false),
  ('Competición', true, false)
on conflict (nombre) do nothing;

-- Clases requeridas por tramo de cinturón (ajustar a la academia).
insert into public.belt_config (cinturon_desde, cinturon_hasta, clases_requeridas) values
  ('blanca',  'azul',    150),
  ('azul',    'violeta', 200),
  ('violeta', 'marron',  200),
  ('marron',  'negra',   250)
on conflict (cinturon_desde) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Primer admin (manual): crear el usuario en Auth y luego ligar el perfil.
--
-- 1) Supabase Dashboard → Authentication → Users → Add user (email + password).
-- 2) Copiar su UUID y correr (reemplazando los valores):
--
--    insert into public.users (id, rol, email)
--    values ('<uuid-del-auth-user>', 'admin', '<email>');
--
-- Para un alumno: crear su fila en students, crear el auth user, y luego:
--    insert into public.users (id, rol, student_id, email)
--    values ('<uuid>', 'alumno', '<student_id>', '<email>');
-- ─────────────────────────────────────────────────────────────

-- Ver el qr_token de la academia para imprimir el QR del kiosko:
select nombre, qr_token from public.academies;
