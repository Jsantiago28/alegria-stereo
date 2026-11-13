-- =====================================================================
-- OPCIONAL — mejora de rendimiento (después de 01-esquema.sql)
-- Pegar completo en: Supabase → SQL Editor → New query → Run
--   Separa las reglas del administrador en crear / editar / borrar para
--   que no se junten con las de "ver" al leer. Con tablas tan pequeñas la
--   diferencia casi no se nota; quita los 5 avisos de rendimiento.
-- (La parte de seguridad —esconder es_admin()— ya está aplicada.)
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['ajustes','programas','cantantes','anuncios','anunciantes'] loop
    execute format('drop policy "admin %s" on public.%I', t, t);
    execute format('create policy "admin crea %s" on public.%I for insert to authenticated with check ((select privado.es_admin()))', t, t);
    execute format('create policy "admin edita %s" on public.%I for update to authenticated using ((select privado.es_admin())) with check ((select privado.es_admin()))', t, t);
    execute format('create policy "admin borra %s" on public.%I for delete to authenticated using ((select privado.es_admin()))', t, t);
  end loop;
end $$;
