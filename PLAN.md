# Alegría Stereo Musical — Plan del sitio

Sitio web de la emisora (cliente real). Astro + Tailwind.
- Datos de la emisora: `src/data/emisora.ts`
- Repositorio privado: https://github.com/Jsantiago28/alegria-stereo (rama `main`)
- Ver en la PC: `npm run dev` → http://localhost:4321

**Lo que se le prometió al cliente:** panel de administrador para publicar sin saber de código + base de datos.
La competencia (demo de QCoreT) no ofrecía ninguna de las dos.

---

## ✅ Fase 1 — Sitio público (HECHO)
- [x] Reproductor en vivo (señal de Zeno), barra fija abajo, controles en la pantalla de bloqueo del celular
- [x] "Sonando ahora" en tiempo real (título de la canción desde Zeno)
- [x] "Al aire ahora / Próximo programa" con cuenta regresiva (hora de RD)
- [x] Programación con horas de RD, México, Perú y la hora del visitante
- [x] Talentos sin Fronteras con su volante completo (todos los lunes, 8:00 p. m. RD)
- [x] Cuadros de Talentos: cada categoría abre WhatsApp con su propio mensaje
- [x] Pide tu canción / dedicatoria → WhatsApp
- [x] Compartir la emisora, contacto, emisora aliada (Radio Music Digital 105.7)
- [x] WhatsApp/teléfono (809) 420-1033, correo, Instagram y TikTok
- [x] Repositorio privado en GitHub

---

## 🔴 PASO 1 — Publicar (URGENTE, empezar por aquí mañana)
La plataforma de monetización le pide la URL al dueño para activar anunciantes.
- [x] Cuenta de Cloudflare
- [x] Publicado en Cloudflare Pages (12/11/2026): **https://alegriastereomusical.pages.dev** — cada push a main se publica solo
- [x] Revisada la versión publicada: radio suena, "Sonando ahora", horarios, sin errores
- [ ] Revisar la vista previa al compartir el enlace por WhatsApp/redes
- [x] `site` en `astro.config.mjs` = alegriastereomusical.pages.dev (cambiar cuando haya dominio)
- [ ] Mandarle la URL al dueño
- [ ] Dominio propio (Cloudflare, ~US$10–11/año, a nombre del dueño). Revisado el 12/11/2026 en el registro oficial:
      **alegriastereomusical.com** (recomendado) y **alegriastereo.com** estaban libres → el dueño elige uno (o los dos)

## 🟠 PASO 2 — Base de datos (Supabase)
- [ ] Crear proyecto `alegria-stereo` en Supabase (ideal: en una cuenta del dueño; la cuenta del usuario
      ya tiene Barbería PRO y el plan gratis permite 2 proyectos)
- [ ] Pasar el **Project URL** y la **anon / publishable key** (NUNCA la service_role / secret)
- [ ] Correo del dueño para entrar al panel
- [ ] Yo preparo el SQL (tablas, fotos, permisos) → el usuario lo pega en Supabase y le da "Run"

## 🟠 PASO 3 — Panel /admin para el dueño
- [ ] Entrar con correo y contraseña (solo el dueño)
- [ ] **Cantantes:** agregar, editar, borrar, marcar "Talento de la semana" (foto, nombre, país, género, redes)
- [ ] **Programas:** agregar, editar, borrar (nombre, días, hora, duración, descripción, volante)
- [ ] **Anuncios / eventos / noticias** con foto: subir y borrar
- [ ] **Anunciantes:** logos/banners que el dueño sube y quita
- [ ] **Datos de la emisora:** teléfono, correo, redes
- [ ] **Pedidos de canciones e inscripciones de talentos** guardados en una lista (además de WhatsApp)
- [ ] Las fotos se achican solas antes de subirlas (el dueño sube la foto tal cual del celular)
- [ ] Si Supabase falla, la página sigue mostrando la información de respaldo

## 🟡 PASO 4 — Secciones nuevas en la página pública
- [ ] "Voces que brillan aquí": Talento de la semana + galería de cantantes (se ve en grande al tocar,
      en el celular se desliza de lado) + botón "¿Quieres estar aquí? Participa"
      → va debajo de Talentos y antes de Pide tu canción
- [ ] Anuncios / eventos
- [ ] Espacio para anunciantes
- [ ] Facebook (cuando el dueño lo mande)

---

## 📋 Pendiente que mande el dueño
- [ ] Duración de cada programa (puse 2 horas)
- [ ] Volante de El Viernes Alegre (hoy se muestra un diseño propio en naranja)
- [ ] Facebook de la emisora (si tiene)
- [ ] Fotos de los cantantes **con su permiso** + nombre artístico, país, género y redes de cada uno
- [ ] Fotos de la cabina y de Robinson Peña
- [ ] Su correo para el panel

## ✔️ Confirmado por el cliente
- [x] Correo: alegriastereomusical@gmail.com
- [x] Instagram: @alalegriastereomusical
- [x] TikTok: @alegriastereomusical
- [x] WhatsApp y teléfono: (809) 420-1033
