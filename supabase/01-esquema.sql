-- =====================================================================
-- Alegría Stereo Musical — base de datos (Supabase)
-- Pegar completo en: Supabase → SQL Editor → New query → Run
-- =====================================================================
-- Quién puede hacer qué:
--   • Cualquier visitante: VER lo publicado (programas, cantantes, anuncios,
--     anunciantes, datos de la emisora) y ENVIAR pedidos de canciones /
--     inscripciones de talentos.
--   • Solo el dueño (administrador): crear, editar y borrar todo, ver los
--     pedidos y subir/borrar fotos.
-- =====================================================================

-- ---------- Administradores ----------
create table public.administradores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  creado timestamptz not null default now()
);
alter table public.administradores enable row level security;
create policy "cada admin se ve a sí mismo" on public.administradores
  for select to authenticated using (user_id = (select auth.uid()));

-- Va en un esquema "privado" que no se publica en la API (nadie la llama desde internet).
create schema if not exists privado;
revoke all on schema privado from public;
grant usage on schema privado to anon, authenticated;

create or replace function privado.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.administradores where user_id = (select auth.uid()));
$$;
revoke all on function privado.es_admin() from public;
grant execute on function privado.es_admin() to anon, authenticated;

-- ---------- Datos de la emisora (una sola fila) ----------
create table public.ajustes (
  id smallint primary key default 1 check (id = 1),
  telefono text check (char_length(telefono) <= 30),
  whatsapp text check (whatsapp ~ '^[0-9]{8,15}$'),
  correo text check (char_length(correo) <= 120),
  instagram text check (char_length(instagram) <= 200),
  tiktok text check (char_length(tiktok) <= 200),
  facebook text check (char_length(facebook) <= 200),
  youtube text check (char_length(youtube) <= 200),
  actualizado timestamptz not null default now()
);

-- ---------- Programas ----------
create table public.programas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 80),
  locutor text not null default 'Robinson Peña' check (char_length(locutor) <= 80),
  apodo text check (char_length(apodo) <= 80),
  dias smallint[] not null check (dias <@ array[0,1,2,3,4,5,6]::smallint[] and cardinality(dias) between 1 and 7),
  hora smallint not null check (hora between 0 and 23),
  minuto smallint not null default 0 check (minuto between 0 and 59),
  duracion_min smallint not null default 120 check (duracion_min between 15 and 720),
  lema text check (char_length(lema) <= 160),
  descripcion text check (char_length(descripcion) <= 600),
  etiquetas text[] not null default '{}',
  volante_url text check (char_length(volante_url) <= 500),
  presenta text check (char_length(presenta) <= 80),
  orden smallint not null default 0,
  activo boolean not null default true,
  creado timestamptz not null default now()
);

-- ---------- Cantantes / talentos ----------
create table public.cantantes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 80),
  pais text check (char_length(pais) <= 60),
  genero text check (char_length(genero) <= 60),
  frase text check (char_length(frase) <= 200),
  foto_url text check (char_length(foto_url) <= 500),
  instagram text check (char_length(instagram) <= 200),
  facebook text check (char_length(facebook) <= 200),
  youtube text check (char_length(youtube) <= 200),
  tiktok text check (char_length(tiktok) <= 200),
  destacado boolean not null default false, -- "Talento de la semana"
  orden smallint not null default 0,
  activo boolean not null default true,
  creado timestamptz not null default now()
);
-- Solo puede haber un "Talento de la semana" a la vez.
create unique index un_solo_destacado on public.cantantes (destacado) where destacado;

-- ---------- Anuncios / eventos / noticias ----------
create table public.anuncios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 120),
  texto text check (char_length(texto) <= 1000),
  imagen_url text check (char_length(imagen_url) <= 500),
  fecha_evento date,
  enlace text check (char_length(enlace) <= 300),
  activo boolean not null default true,
  creado timestamptz not null default now()
);

-- ---------- Anunciantes / patrocinadores ----------
create table public.anunciantes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 80),
  logo_url text check (char_length(logo_url) <= 500),
  enlace text check (char_length(enlace) <= 300),
  orden smallint not null default 0,
  activo boolean not null default true,
  creado timestamptz not null default now()
);

-- ---------- Pedidos de canciones e inscripciones de talentos ----------
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('cancion', 'talento')),
  nombre text not null check (char_length(nombre) between 1 and 60),
  cancion text check (char_length(cancion) <= 120),
  dedicada_a text check (char_length(dedicada_a) <= 80),
  mensaje text check (char_length(mensaje) <= 300),
  desde text check (char_length(desde) <= 60),
  atendido boolean not null default false,
  creado timestamptz not null default now()
);

-- ---------- Permisos (RLS) ----------
alter table public.ajustes enable row level security;
alter table public.programas enable row level security;
alter table public.cantantes enable row level security;
alter table public.anuncios enable row level security;
alter table public.anunciantes enable row level security;
alter table public.pedidos enable row level security;

-- Ver: el público ve lo activo; el admin lo ve todo.
create policy "ver ajustes" on public.ajustes for select to anon, authenticated using (true);
create policy "ver programas" on public.programas for select to anon, authenticated using (activo or (select privado.es_admin()));
create policy "ver cantantes" on public.cantantes for select to anon, authenticated using (activo or (select privado.es_admin()));
create policy "ver anuncios" on public.anuncios for select to anon, authenticated using (activo or (select privado.es_admin()));
create policy "ver anunciantes" on public.anunciantes for select to anon, authenticated using (activo or (select privado.es_admin()));

-- Crear / editar / borrar: solo el admin.
create policy "admin ajustes" on public.ajustes for all to authenticated using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy "admin programas" on public.programas for all to authenticated using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy "admin cantantes" on public.cantantes for all to authenticated using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy "admin anuncios" on public.anuncios for all to authenticated using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy "admin anunciantes" on public.anunciantes for all to authenticated using ((select privado.es_admin())) with check ((select privado.es_admin()));

-- Pedidos: cualquiera puede enviar uno (nuevo, sin marcar como atendido); solo el admin los ve y maneja.
create policy "enviar pedido" on public.pedidos for insert to anon, authenticated with check (atendido = false);
create policy "admin ve pedidos" on public.pedidos for select to authenticated using ((select privado.es_admin()));
create policy "admin maneja pedidos" on public.pedidos for update to authenticated using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy "admin borra pedidos" on public.pedidos for delete to authenticated using ((select privado.es_admin()));

grant select on public.ajustes, public.programas, public.cantantes, public.anuncios, public.anunciantes to anon, authenticated;
grant insert, update, delete on public.ajustes, public.programas, public.cantantes, public.anuncios, public.anunciantes to authenticated;
grant insert on public.pedidos to anon, authenticated;
grant select, update, delete on public.pedidos to authenticated;
grant select on public.administradores to authenticated;

-- ---------- Fotos (Storage) ----------
-- Carpeta pública "fotos": cualquiera puede verlas; solo el admin sube, cambia o borra.
-- Máximo 5 MB por foto (el panel las achica antes de subirlas).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "admin sube fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (select privado.es_admin()));
create policy "admin cambia fotos" on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and (select privado.es_admin()));
create policy "admin borra fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (select privado.es_admin()));
create policy "admin lista fotos" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (select privado.es_admin()));

-- ---------- Datos iniciales (lo que ya tiene la página) ----------
insert into public.ajustes (id, telefono, whatsapp, correo, instagram, tiktok)
values (1, '(809) 420-1033', '18094201033', 'alegriastereomusical@gmail.com',
        'https://www.instagram.com/alalegriastereomusical/', 'https://www.tiktok.com/@alegriastereomusical');

insert into public.programas (nombre, locutor, apodo, dias, hora, minuto, duracion_min, lema, descripcion, etiquetas, presenta, orden)
values
  ('Talentos sin Fronteras', 'Robinson Peña', 'El Maestro del Amor', '{1}', 20, 0, 120,
   '¡El escenario donde el talento no tiene fronteras!',
   'Un espacio para apoyar y proyectar nuevos talentos de la música, la poesía, la composición y más.',
   '{"Cantantes independientes","Nuevas bandas","Compositores y poetas","Escritores y artistas","Entrevistas"}',
   'Radio Music Digital 105.7', 1),
  ('El Viernes Alegre', 'Robinson Peña', 'El Maestro del Amor', '{5}', 20, 0, 120,
   'Para cerrar la semana con el pie derecho.',
   'Merengue, música bailable y mucha interacción con los oyentes para arrancar el fin de semana con alegría.',
   '{"Merengue","Alegría","Música","Interacción"}', null, 2);
