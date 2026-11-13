-- =====================================================================
-- Convierte al dueño en administrador del panel.
-- ANTES: crear su usuario en Supabase → Authentication → Users → Add user
--        (con su correo y una contraseña, marcando "Auto Confirm User").
-- Luego pegar esto en SQL Editor → Run.
-- =====================================================================
insert into public.administradores (user_id)
select id from auth.users where email = 'alegriastereomusical@gmail.com'
on conflict do nothing;

-- Comprobar: debe salir 1 fila con el correo del dueño.
select u.email, a.creado
from public.administradores a
join auth.users u on u.id = a.user_id;
