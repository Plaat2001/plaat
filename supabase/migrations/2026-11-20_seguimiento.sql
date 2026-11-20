-- Nuevo módulo "Acta de seguimiento de obra" (pestaña "Seguimiento", entre Acta VO y
-- Notas y tareas). Igual que `incidencias`/`notas`, cada punto y cada reunión es una
-- fila independiente (no un blob único como `actas_vo`), porque una obra puede acumular
-- varios cientos de puntos.
--
-- Cambio puramente ADITIVO: no toca ninguna tabla existente. Las políticas RLS se
-- copian automáticamente de las que ya tiene `incidencias` (mismo patrón de acceso por
-- obra compartida que usan todas las tablas de módulos), así no hay que adivinar ni
-- reescribir a mano la condición de acceso.
--
-- Cómo ejecutarlo: Supabase Dashboard → SQL Editor → pegar y ejecutar entero.

create table if not exists public.seguimiento_puntos (
  id text primary key,
  obra_id text not null references public.obras(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists seguimiento_puntos_obra_id_idx on public.seguimiento_puntos(obra_id);
alter table public.seguimiento_puntos enable row level security;

create table if not exists public.seguimiento_reuniones (
  id text primary key,
  obra_id text not null references public.obras(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists seguimiento_reuniones_obra_id_idx on public.seguimiento_reuniones(obra_id);
alter table public.seguimiento_reuniones enable row level security;

-- Copia cada política RLS que tenga hoy "incidencias" a las dos tablas nuevas, con el
-- mismo predicado (qual/with_check) y el mismo comando (SELECT/INSERT/UPDATE/DELETE/ALL),
-- solo con el nombre renombrado para que no choque entre tablas.
do $$
declare
  pol record;
  nueva text;
begin
  foreach nueva in array array['seguimiento_puntos', 'seguimiento_reuniones'] loop
    for pol in
      select policyname, cmd, qual, with_check, roles
      from pg_policies
      where schemaname = 'public' and tablename = 'incidencias'
    loop
      execute format(
        'create policy %I on public.%I as permissive for %s to %s %s %s',
        pol.policyname || '_' || nueva,
        nueva,
        pol.cmd,
        array_to_string(pol.roles, ', '),
        case when pol.qual is not null then 'using (' || pol.qual || ')' else '' end,
        case when pol.with_check is not null then 'with check (' || pol.with_check || ')' else '' end
      );
    end loop;
  end loop;
end $$;

-- Verificación rápida tras ejecutar (debe listar las políticas recién creadas):
-- select tablename, policyname, cmd from pg_policies where tablename in ('seguimiento_puntos','seguimiento_reuniones');
