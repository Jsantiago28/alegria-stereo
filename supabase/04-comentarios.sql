-- =====================================================================
-- Comentarios y reseñas de los oyentes (después de 01 y 03).
-- • Cualquiera puede ENVIAR uno, pero entra sin aprobar (no se ve en la página).
-- • El público solo VE los aprobados.
-- • Solo el dueño aprueba, oculta, destaca o borra.
-- =====================================================================
create table public.comentarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(btrim(nombre)) between 1 and 60),
  pais text check (char_length(pais) <= 60),
  estrellas smallint check (estrellas between 1 and 5),
  texto text not null check (char_length(btrim(texto)) between 3 and 300),
  aprobado boolean not null default false,
  destacado boolean not null default false,
  revisado boolean not null default false, -- el dueño ya lo vio (aprobado u oculto); los no revisados son "por revisar"
  creado timestamptz not null default now()
);
create index comentarios_aprobados on public.comentarios (aprobado, destacado desc, creado desc);

alter table public.comentarios enable row level security;

create policy "enviar comentario" on public.comentarios for insert to anon, authenticated
  with check (aprobado = false and destacado = false and revisado = false);
create policy "ver comentarios" on public.comentarios for select to anon, authenticated
  using (aprobado or (select privado.es_admin()));
create policy "admin edita comentarios" on public.comentarios for update to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy "admin borra comentarios" on public.comentarios for delete to authenticated
  using ((select privado.es_admin()));

grant select, insert on public.comentarios to anon, authenticated;
grant update, delete on public.comentarios to authenticated;
