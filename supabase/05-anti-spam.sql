-- =====================================================================
-- Freno contra el spam en los formularios de la página (pedidos y comentarios).
-- • Cada envío guarda un código anónimo de la conexión (no la dirección real).
-- • Una misma conexión: máximo 3 comentarios y 6 pedidos cada 10 minutos.
-- • Toda la página junta: máximo 40 comentarios y 120 pedidos cada 10 minutos
--   (por si un robot cambia de conexión). Si se pasa, la base rechaza el envío.
-- =====================================================================
alter table public.pedidos add column if not exists origen text;
alter table public.comentarios add column if not exists origen text;
create index if not exists pedidos_origen on public.pedidos (origen, creado desc);
create index if not exists comentarios_origen on public.comentarios (origen, creado desc);

-- El público solo puede leer estas columnas de los comentarios aprobados (el código anónimo no).
revoke select on public.comentarios from anon;
grant select (id, nombre, pais, estrellas, texto, aprobado, destacado, revisado, creado) on public.comentarios to anon;

create or replace function privado.frenar_spam()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cabeceras json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  ip text := coalesce(cabeceras->>'cf-connecting-ip', split_part(cabeceras->>'x-forwarded-for', ',', 1), 'desconocido');
  por_conexion int;
  en_total int;
  limite_conexion int := case when tg_table_name = 'comentarios' then 3 else 6 end;
  limite_total int := case when tg_table_name = 'comentarios' then 40 else 120 end;
begin
  new.origen := md5('alegria-stereo:' || btrim(ip));
  if tg_table_name = 'comentarios' then
    select count(*) filter (where origen = new.origen), count(*) into por_conexion, en_total
      from public.comentarios where creado > now() - interval '10 minutes';
  else
    select count(*) filter (where origen = new.origen), count(*) into por_conexion, en_total
      from public.pedidos where creado > now() - interval '10 minutes';
  end if;
  if por_conexion >= limite_conexion or en_total >= limite_total then
    raise exception 'demasiados envios, espera unos minutos' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function privado.frenar_spam() from public;

create trigger frenar_spam before insert on public.pedidos
  for each row execute function privado.frenar_spam();
create trigger frenar_spam before insert on public.comentarios
  for each row execute function privado.frenar_spam();
