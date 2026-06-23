# BJJ Tracker

Sistema de asistencia y progreso de cinturones para academias de Brazilian Jiu-Jitsu. Los alumnos registran su asistencia en un kiosko público con QR + DNI; el sistema lleva la cuenta de clases y calcula cuánto falta para el siguiente cinturón.

---

## Índice

1. [Funcionalidades](#funcionalidades)
2. [Stack](#stack)
3. [Arquitectura](#arquitectura)
4. [Requisitos previos](#requisitos-previos)
5. [Arranque rápido (sin Supabase)](#arranque-rápido-sin-supabase)
6. [Variables de entorno](#variables-de-entorno)
7. [Modo desarrollo: bypass de login + datos mock](#modo-desarrollo-bypass-de-login--datos-mock)
8. [Setup de Supabase (paso a paso)](#setup-de-supabase-paso-a-paso)
9. [Crear usuarios (admin, profesor, alumno)](#crear-usuarios-admin-profesor-alumno)
10. [Generar e imprimir el QR del kiosko](#generar-e-imprimir-el-qr-del-kiosko)
11. [Scripts disponibles](#scripts-disponibles)
12. [Estructura del proyecto](#estructura-del-proyecto)
13. [Esquema de base de datos](#esquema-de-base-de-datos)
14. [Roles y seguridad](#roles-y-seguridad)
15. [Deploy a producción](#deploy-a-producción)
16. [Checklist de producción](#checklist-de-producción)
17. [Troubleshooting](#troubleshooting)

---

## Funcionalidades

El sistema tiene **4 vistas principales**:

| Ruta | Quién | Para qué |
|------|-------|----------|
| `/checkin` | Público (sin login) | Kiosko en la entrada. El alumno elige tipo de clase, ingresa su DNI y registra asistencia. Muestra confirmación con nombre, cinturón y progreso. |
| `/admin` | Admin | CRUD de alumnos, configuración de clases requeridas por cinturón, gestión de tipos de clase (Gi, No-Gi, Kids, Competición), generación e impresión del QR de la academia. |
| `/profesor` | Profesor / Admin | Lista de presentes en la clase actual, progreso individual de cada alumno, corrección manual de asistencia. |
| `/alumno` | Alumno | Portal personal: cinturón actual, clases acumuladas, cuánto falta para subir, historial de clases. |

**Regla de progreso:** solo cuentan para subir de cinturón las clases cuyo tipo tiene marcado `cuenta_para_progreso` (por defecto Gi y No-Gi; Kids y Competición no). Configurable desde `/admin`.

📐 **Mockups de cada pantalla + diagramas de navegación y del flujo de check-in:** [`docs/VISTAS.md`](./docs/VISTAS.md)

---

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions, Turbopack) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (registry `base-nova`, construido sobre **Base UI**)
- **Supabase**: Auth + PostgreSQL + (Storage, a futuro)
- **qrcode** para generar el QR del kiosko

> ⚠️ Nota sobre shadcn: este proyecto usa el registry `base-nova`, que está basado en **Base UI**, no en Radix. Diferencias clave: se usa `render={<Comp/>}` en lugar de `asChild`, y `<SelectValue>` necesita una función `{(v) => label}` para mostrar la etiqueta.

---

## Arquitectura

```
Navegador ──► Next.js (Server Components / Server Actions)
                   │
                   ├── lib/data/*  (capa de acceso a datos)
                   │      │
                   │      ├── modo REAL  ─► Supabase (RLS aplica)
                   │      └── modo MOCK   ─► fixtures en memoria (lib/data/mock.ts)
                   │
                   └── proxy.ts (ex-middleware) ─► refresca sesión + gating de rutas
```

- **Capa de datos (`lib/data/`)**: cada función tiene dos ramas — una contra Supabase (real) y otra contra fixtures en memoria (mock). El modo se elige automáticamente (ver más abajo). Esto permite desarrollar la UI sin tener Supabase configurado.
- **Mutaciones**: siempre vía **Server Actions** con validación de rol *dentro* de cada action (`requireRole(...)`), porque las actions son endpoints POST públicos.
- **Check-in público**: el kiosko es anónimo y **nunca escribe directo** en la tabla `attendance`. Pasa por la función Postgres `check_in(...)` (`SECURITY DEFINER`), que valida el token de la academia y el DNI antes de insertar. Así RLS mantiene `attendance` cerrada a profesores/admins.
- **Proxy (`proxy.ts`)**: en Next 16 el "middleware" se llama Proxy. Refresca la sesión de Supabase en cada request y hace un chequeo optimista de rol para `/admin`, `/profesor`, `/alumno`. La autorización real se re-valida en cada Server Component/Action.

---

## Requisitos previos

- **Node.js 20+** (probado con Node 24)
- **npm** (viene con Node)
- Para producción: una cuenta gratuita en **[Supabase](https://supabase.com)**

---

## Arranque rápido (sin Supabase)

Podés levantar la app y navegar las 4 vistas **sin crear ningún proyecto Supabase**, gracias al modo mock + bypass de login.

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de entorno para desarrollo
#    (en Windows PowerShell usá:  Set-Content .env.local "DEV_BYPASS_ROLE=admin")
echo "DEV_BYPASS_ROLE=admin" > .env.local

# 3. Levantar el server de desarrollo
npm run dev
```

Abrí **http://localhost:3000**. Vas a ver el landing con las 4 vistas. Con `DEV_BYPASS_ROLE=admin` entrás a `/admin` sin login y con datos de prueba.

> Para probar otras vistas como otro rol, cambiá el valor a `profesor` o `alumno` y reiniciá el server. El kiosko `/checkin` necesita el token de la academia mock: **http://localhost:3000/checkin?academy=11111111-1111-1111-1111-111111111111**

---

## Variables de entorno

Copiá `.env.local.example` a `.env.local` y completá según el caso.

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí (producción) | URL del proyecto Supabase. Si está vacía o contiene `placeholder`, la app entra en **modo mock**. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí (producción) | Clave pública `anon` de Supabase. |
| `DEV_BYPASS_ROLE` | No (solo dev) | `admin` \| `profesor` \| `alumno`. Saltea el login y actúa como ese rol. **Se ignora en producción.** |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Solo si más adelante se necesitan operaciones server-side con privilegios. **Nunca exponer al cliente.** |

`.env.local` está en `.gitignore`: no se commitea.

---

## Modo desarrollo: bypass de login + datos mock

Dos mecanismos, pensados para desarrollar sin fricción:

### Modo mock (datos en memoria)

Se activa **automáticamente** cuando `NEXT_PUBLIC_SUPABASE_URL` está vacía o contiene `placeholder`. La capa `lib/data/*` devuelve fixtures de `lib/data/mock.ts` (3 alumnos, tipos de clase, config de cinturones, una academia y asistencias de ejemplo). Las mutaciones (crear/editar/eliminar) persisten **en memoria** mientras viva el proceso de `npm run dev` (se reinician al reiniciar el server).

### Bypass de login (`DEV_BYPASS_ROLE`)

Con `DEV_BYPASS_ROLE=admin|profesor|alumno`, `getCurrentUser()` y el proxy actúan como ese rol sin necesidad de login. Se ignora por completo cuando `NODE_ENV=production`.

> Ambos son **solo para desarrollo**. En producción no tienen efecto: la app usa Supabase real y login real.

---

## Setup de Supabase (paso a paso)

Cuando quieras datos reales y persistentes:

### 1. Crear el proyecto

1. Entrá a https://supabase.com y creá una cuenta (gratis).
2. **New project** → elegí nombre, contraseña de base de datos y región (la más cercana).
3. Esperá ~2 minutos a que termine de provisionarse.

### 2. Correr el SQL (en orden)

En el dashboard de Supabase → **SQL Editor** → **New query**. Pegá y ejecutá el contenido de cada archivo, **en este orden exacto**:

1. `supabase/01_schema.sql` — tablas, enums e índices.
2. `supabase/02_rls.sql` — Row Level Security (políticas de acceso).
3. `supabase/03_functions.sql` — funciones (`check_in`, `academy_by_token`) y la vista de progreso.
4. `supabase/04_seed.sql` — datos iniciales (1 academia, tipos de clase, config de cinturones).

Cada archivo es idempotente (se puede correr más de una vez sin romper).

### 3. Obtener las claves

Dashboard → **Project Settings** → **API**. Copiá:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Configurar `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
# NO pongas DEV_BYPASS_ROLE cuando uses Supabase real
```

Reiniciá `npm run dev`. Ahora la app usa Supabase (modo mock desactivado).

### 5. Verificar

En el SQL Editor probá:

```sql
select nombre, qr_token from public.academies;   -- debería devolver "Academia Principal"
select * from public.class_types;                 -- Gi, No-Gi, Kids, Competición
select * from public.v_student_progress;          -- vacío hasta que haya alumnos/asistencias
```

---

## Crear usuarios (admin, profesor, alumno)

El sistema separa **autenticación** (tabla `auth.users` de Supabase) de **perfil/rol** (tabla `public.users`). Hay que crear ambos.

### Primer admin

1. Dashboard → **Authentication** → **Users** → **Add user** → email + contraseña.
2. Copiá el **UUID** del usuario recién creado.
3. SQL Editor:

```sql
insert into public.users (id, rol, email)
values ('UUID-DEL-AUTH-USER', 'admin', 'admin@tuacademia.com');
```

4. Entrá a la app, andá a `/login`, ingresá con ese email/contraseña → te lleva a `/admin`.

### Profesor

Igual que el admin pero con `rol = 'profesor'`:

```sql
insert into public.users (id, rol, email)
values ('UUID', 'profesor', 'profe@tuacademia.com');
```

### Alumno (con acceso al portal)

1. Primero creá la ficha del alumno (o creala desde `/admin` → Alumnos):

```sql
insert into public.students (dni, nombre, cinturon_actual, fecha_inicio)
values ('30111222', 'Juan Pérez', 'azul', '2022-03-01')
returning id;   -- guardá este student_id
```

2. Creá el auth user (Authentication → Add user) y copiá su UUID.
3. Vinculá perfil + ficha:

```sql
insert into public.users (id, rol, student_id, email)
values ('UUID-AUTH', 'alumno', 'STUDENT-ID-DEL-PASO-1', 'juan@mail.com');
```

> Un alumno **no necesita** auth user para hacer check-in (eso va por DNI en el kiosko). El auth user solo es para que pueda entrar a su portal `/alumno`.

---

## Generar e imprimir el QR del kiosko

1. Entrá como admin → **`/admin`** → pestaña **QR Academia**.
2. Vas a ver el QR que apunta a `https://TU-DOMINIO/checkin?academy=<qr_token>`.
3. Botones disponibles:
   - **Imprimir** — abre el diálogo de impresión con solo el QR (oculta la navegación).
   - **Copiar URL** — copia la URL de check-in.
   - **Regenerar** — genera un token nuevo (el QR impreso anterior deja de funcionar; hay que reimprimir).
4. Pegá el QR impreso en la entrada. Los alumnos lo escanean con la cámara del celular → los lleva a `/checkin?academy=...` → eligen tipo de clase, ingresan DNI y listo.

> La URL del QR usa el host del request. En local sale `http://localhost:...`; en producción sale tu dominio real.

---

## Scripts disponibles

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Server de desarrollo (Turbopack) en http://localhost:3000 |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |

---

## Estructura del proyecto

```
app/
  page.tsx                 Landing con links a las 4 vistas
  layout.tsx               Layout raíz (es, Toaster)
  globals.css              Tailwind v4 + estilos de impresión
  checkin/                 Kiosko público (page, client, action)
  admin/
    layout.tsx             Shell + nav del admin
    alumnos/               CRUD de alumnos
    clases/                Tipos de clase (toggles activo / cuenta_para_progreso)
    cinturones/            Clases requeridas por tramo
    qr/                    QR de la academia (imprimir / regenerar)
  profesor/                Presentes + progreso + corrección
  alumno/                  Portal del alumno
  login/                   Login real (form + action)

lib/
  config.ts                isMockMode() / devBypassRole()
  auth.ts                  getCurrentUser() / requireRole()
  auth-actions.ts          loginAction / logoutAction
  belts.ts                 Constantes de cinturones (orden, labels, colores)
  data/                    Capa de datos (rama mock + rama Supabase)
    students, class-types, belt-config, academy, attendance, progress, checkin, mock
  supabase/
    client.ts              Cliente browser
    server.ts              Cliente server (cookies)
    proxy.ts               Helper de sesión + gating (usado por proxy.ts raíz)
    types.ts               Tipos de la base (manuales)

components/
  ui/                      Componentes shadcn (base-nova / Base UI)
  logout-button.tsx        Botón Salir (server action)
  construccion.tsx         Placeholder "en construcción"

proxy.ts                   Proxy de Next 16 (ex-middleware), en la raíz
supabase/                  Migraciones SQL (01..04)
```

---

## Esquema de base de datos

**Tablas**

- `academies` — `id`, `nombre`, `qr_token` (uuid único para la URL del kiosko), `created_at`
- `students` — `id`, `dni` (único), `nombre`, `foto_url`, `cinturon_actual`, `fecha_inicio`, `created_at`
- `belt_config` — `cinturon_desde`, `cinturon_hasta`, `clases_requeridas` (por tramo)
- `class_types` — `nombre`, `activo`, `cuenta_para_progreso`
- `attendance` — `student_id`, `class_type_id`, `fecha`, `hora`, `registrado_por` (null = auto check-in del kiosko)
- `users` — `id` (= `auth.users.id`), `rol` (admin/profesor/alumno), `student_id` (nullable), `email`

**Enums:** `belt_color` (blanca, azul, violeta, marron, negra) · `user_rol` (admin, profesor, alumno)

**Funciones / vistas**

- `check_in(p_qr_token, p_dni, p_class_type_id)` — registra asistencia desde el kiosko anónimo (valida token + DNI). `SECURITY DEFINER`, ejecutable por `anon`.
- `academy_by_token(p_qr_token)` — valida el QR y devuelve nombre de la academia (para el kiosko). Ejecutable por `anon`.
- `v_student_progress` — vista que calcula clases contadas (solo tipos con `cuenta_para_progreso`), cinturón siguiente y clases faltantes por alumno.

> **Simplificación actual del progreso:** el conteo de clases es histórico y no se reinicia al subir de cinturón (no hay tabla de historial de promociones). Es una mejora pendiente.

---

## Roles y seguridad

- **admin** — acceso total (RLS le permite todo).
- **profesor** — gestiona asistencia y ve alumnos; no toca configuración sensible.
- **alumno** — solo lee su propia ficha y sus propias asistencias (RLS por `student_id`).
- **anon** (kiosko) — no lee tablas directo; solo ejecuta `check_in` y `academy_by_token`, y lee `class_types` (nombres, no sensible).

RLS está activo en todas las tablas (ver `02_rls.sql`). Las Server Actions revalidan el rol con `requireRole(...)` además del gating del proxy.

---

## Deploy a producción

Recomendado: **Vercel**.

1. Subí el repo a GitHub.
2. En Vercel → **New Project** → importá el repo. Vercel detecta Next.js automáticamente.
3. **Environment Variables** (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **NO** agregues `DEV_BYPASS_ROLE` (igual se ignora en producción, pero no lo pongas).
4. **Deploy**.
5. En Supabase → **Authentication** → **URL Configuration**, agregá tu dominio de Vercel a los *redirect URLs* / *Site URL*.

> El monorepo tiene la app en la subcarpeta `bjj-tracker/`. Si Vercel no la detecta, configurá el **Root Directory** del proyecto en `bjj-tracker`.

---

## Checklist de producción

- [ ] Proyecto Supabase creado
- [ ] `01_schema.sql` → `02_rls.sql` → `03_functions.sql` → `04_seed.sql` corridos en orden
- [ ] `.env.local` (local) / env vars (Vercel) con URL + anon key reales
- [ ] **Sin** `DEV_BYPASS_ROLE`
- [ ] Primer admin creado (auth user + fila en `public.users`)
- [ ] Tipos de clase y `belt_config` ajustados a la academia desde `/admin`
- [ ] QR generado e impreso (`/admin` → QR Academia)
- [ ] Dominio agregado en Supabase Auth URL Configuration

---

## Troubleshooting

**`/admin` redirige a `/login` aunque puse `DEV_BYPASS_ROLE`**
El bypass se ignora si `NODE_ENV=production`. Asegurate de estar en `npm run dev`, no en un build. Reiniciá el server tras cambiar `.env.local`.

**La app muestra "datos de prueba" pero ya configuré Supabase**
El modo mock se activa si `NEXT_PUBLIC_SUPABASE_URL` está vacía o contiene `placeholder`. Verificá `.env.local` y reiniciá `npm run dev`.

**El kiosko dice "QR inválido"**
El `academy` de la URL no coincide con ningún `qr_token`. Sacá el QR/URL correctos desde `/admin` → QR Academia. En modo mock el token válido es `11111111-1111-1111-1111-111111111111`.

**El login da "Email o contraseña incorrectos" con credenciales correctas**
Verificá que exista la fila en `public.users` para ese auth user. Sin perfil, el login falla con "Tu usuario no tiene perfil asignado".

**Cambié `.env.local` y no toma efecto**
Next lee las variables al iniciar. Pará (`Ctrl+C`) y volvé a correr `npm run dev`.
