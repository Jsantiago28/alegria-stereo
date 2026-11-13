# Cómo sacar una copia de seguridad de la base

El plan gratis de Supabase **no guarda copias automáticas**. Conviene sacar una copia al entregar y luego
una vez al mes (o antes de cambios grandes).

Las copias van en la carpeta `respaldos/` del proyecto, que **no se sube a GitHub** (tiene nombres de oyentes).

## Opción 1 — Pedírselo a Claude (lo más fácil)
Con el conector de Supabase conectado, decir: *"saca una copia de seguridad de la base de Alegría Stereo"*.
Claude exporta todas las tablas a `respaldos/respaldo-AAAA-MM-DD.json`.

## Opción 2 — A mano desde Supabase
1. Entrar a https://supabase.com → proyecto **alegria-stereo** → **Table Editor**.
2. Abrir cada tabla (`ajustes`, `programas`, `cantantes`, `anuncios`, `anunciantes`, `pedidos`, `comentarios`)
   → botón **Export** → **Export table as CSV**.
3. Guardar los archivos en `respaldos/AAAA-MM-DD/`.

## Las fotos
Están en Supabase → **Storage** → carpeta `fotos` (subcarpetas `cantantes`, `volantes`, `anuncios`, `anunciantes`).
Se pueden descargar desde ahí. Al entregar (13/11/2026) no había fotos subidas.

## Para restaurar
1. Crear las tablas con `supabase/01-esquema.sql`, `03-endurecer-permisos.sql` y `04-comentarios.sql`.
2. Volver a cargar los datos (Table Editor → **Insert** → **Import data from CSV**, o pedírselo a Claude).
3. Hacer administrador al dueño con `supabase/02-hacer-admin.sql`.
