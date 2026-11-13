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

## 🔴 PASO 1 — Publicar
La plataforma de monetización le pide la URL al dueño para activar anunciantes.
- [x] Cuenta de Cloudflare
- [x] Publicado en Cloudflare Pages (12/11/2026): **https://alegriastereomusical.pages.dev** — cada push a main se publica solo
- [x] Revisada la versión publicada: radio suena, "Sonando ahora", horarios, sin errores
- [ ] Revisar la vista previa al compartir el enlace por WhatsApp/redes
- [x] `site` en `astro.config.mjs` = https://alegriastereomusical.com
- [ ] Mandarle la URL al dueño
- [x] Dominio **alegriastereomusical.com** comprado en Cloudflare (12/11/2026, US$11.17/año) a nombre de Robinzon Urbaez — renovación automática ACTIVA (confirmado 12/11/2026)
- [x] Conectado a la página: https://alegriastereomusical.com funciona con https
- [x] www.alegriastereomusical.com conectado (registro CNAME www → alegriastereomusical.pages.dev agregado a mano en DNS)
- [ ] ⚠️ **El dueño debe verificar el correo de Cloudflare/ICANN en alegriastereomusical@gmail.com antes del 26/11/2026** o suspenden el dominio

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
- [ ] Subir su logo al perfil de Zeno (hoy sale un círculo verde vacío)

## 🔎 Que el dueño confirme con Zeno
- [ ] **¿Zeno cuenta a los oyentes que escuchan desde nuestra página?** (NO está confirmado: Zeno no lo dice)
      Prueba de 5 minutos:
      1. El dueño abre las estadísticas de oyentes en vivo en su panel de Zeno y anota el número.
      2. Abrimos alegriastereomusical.pages.dev en 2–3 teléfonos/computadoras y le damos play.
      3. Si el número sube en 2–3 → confirmado.
      → Si NO sube: cambiar nuestro reproductor por el reproductor oficial de Zeno (manteniendo el diseño).
- [ ] **¿Los anuncios de audio de Zeno suenan también en nuestra página?** (deberían, porque van dentro de
      la transmisión, pero confirmarlo; importante para la monetización)
- [ ] **Licencias de música:** según Zeno, sus licencias (ASCAP, BMI, SESAC) solo cubren lo que se escucha en
      zeno.fm, no en la página propia de la emisora. Zeno recomienda sacar licencias propias para el sitio web.
      Pasa con cualquier página que transmita la radio (también con la demo de QCoreT).
      → Que el dueño lo consulte, sobre todo antes de monetizar.
      Fuente: https://help.zeno.fm/en/articles/8348796-plans-faq

## ✔️ Confirmado por el cliente
- [x] Correo: alegriastereomusical@gmail.com
- [x] Instagram: @alalegriastereomusical
- [x] TikTok: @alegriastereomusical
- [x] WhatsApp y teléfono: (809) 420-1033
