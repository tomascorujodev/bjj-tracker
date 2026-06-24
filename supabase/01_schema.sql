-- BJJ Tracker — Schema (MVP, una sola academia)
-- Ejecutar en el SQL editor de Supabase. Orden: 01_schema -> 02_rls -> 03_functions -> 04_seed.

-- Extensiones
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
do $$ begin
  create type belt_color as enum ('blanco', 'azul', 'violeta', 'marron', 'negro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_rol as enum ('admin', 'profesor', 'alumno');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- academies — guarda el qr_token fijo del kiosko de check-in
-- ─────────────────────────────────────────────────────────────
create table if not exists public.academies (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  qr_token    uuid not null unique default gen_random_uuid(),
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- students
-- ─────────────────────────────────────────────────────────────
create table if not exists public.students (
  id              uuid primary key default gen_random_uuid(),
  dni             text not null unique,
  nombre          text not null,
  foto_url        text,
  cinturon_actual belt_color not null default 'blanco',
  fecha_inicio    date not null default current_date,
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- belt_config — clases requeridas para pasar de un cinturón al siguiente
-- ─────────────────────────────────────────────────────────────
create table if not exists public.belt_config (
  id                 uuid primary key default gen_random_uuid(),
  cinturon_desde     belt_color not null,
  cinturon_hasta     belt_color not null,
  clases_requeridas  int not null check (clases_requeridas >= 0),
  unique (cinturon_desde)
);

-- ─────────────────────────────────────────────────────────────
-- class_types — Gi, No-Gi, Kids, Competición.
-- cuenta_para_progreso: si false, no suma para subir de cinturón.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.class_types (
  id                   uuid primary key default gen_random_uuid(),
  nombre               text not null unique,
  activo               boolean not null default true,
  cuenta_para_progreso boolean not null default true
);

-- ─────────────────────────────────────────────────────────────
-- attendance — un registro por check-in
-- registrado_por: NULL = auto check-in del kiosko; si no, el user (profesor/admin) que lo cargó.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.attendance (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.students(id) on delete cascade,
  class_type_id  uuid not null references public.class_types(id) on delete restrict,
  fecha          date not null default current_date,
  hora           time not null default (now()::time),
  registrado_por uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index if not exists attendance_student_idx on public.attendance(student_id);
create index if not exists attendance_fecha_idx on public.attendance(fecha);

-- ─────────────────────────────────────────────────────────────
-- users — perfil ligado a auth.users (id = auth.users.id)
-- student_id: solo para rol 'alumno', apunta a su ficha de students.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  rol         user_rol not null default 'alumno',
  student_id  uuid references public.students(id) on delete set null,
  email       text not null
);

create index if not exists users_student_idx on public.users(student_id);
