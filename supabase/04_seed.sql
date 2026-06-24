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
  ('blanco',  'azul',    150),
  ('azul',    'violeta', 200),
  ('violeta', 'marron',  200),
  ('marron',  'negro',   250)
on conflict (cinturon_desde) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Cuentas (requiere 07_enrollment.sql ya aplicado).
--
-- Con 07, al crear un usuario en Auth un trigger le crea su fila en public.users
-- como alumno PENDIENTE. Los alumnos se auto-registran desde /registro y el staff
-- los acepta en /solicitudes (ahí se crea/vincula su ficha en students).
--
-- Primer admin (manual, una vez):
-- 1) Supabase Dashboard → Authentication → Users → Add user (email + password).
--    (El trigger crea su fila en public.users como alumno/pendiente.)
-- 2) Promoverlo a admin:
--    update public.users set rol = 'admin', estado = 'activo' where email = '<email>';
--
-- Profesor: igual que el admin pero rol = 'profesor'.
-- ─────────────────────────────────────────────────────────────

-- Ver el qr_token de la academia para imprimir el QR del kiosko:
select nombre, qr_token from public.academies;
