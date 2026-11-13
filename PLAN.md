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

## ✅ PASO 1 — Publicar (HECHO)
La plataforma de monetización le pide la URL al dueño para activar anunciantes.
- [x] Cuenta de Cloudflare
- [x] Publicado en Cloudflare Pages (12/11/2026): **https://alegriastereomusical.pages.dev** — cada push a main se publica solo
- [x] Revisada la versión publicada: radio suena, "Sonando ahora", horarios, sin errores
- [ ] Revisar la vista previa al compartir el enlace por WhatsApp/redes
- [x] `site` en `astro.config.mjs` = https://alegriastereomusical.com
- [x] El dueño ya tiene su dirección: alegriastereomusical.com
- [x] Dominio **alegriastereomusical.com** comprado en Cloudflare (12/11/2026, US$11.17/año) a nombre de Robinzon Urbaez — renovación automática ACTIVA (confirmado 12/11/2026)
- [x] Conectado a la página: https://alegriastereomusical.com funciona con https
- [x] www.alegriastereomusical.com conectado (registro CNAME www → alegriastereomusical.pages.dev agregado a mano en DNS)
- [x] Correo de verificación ICANN confirmado por el dueño (12/11/2026)

## 🟠 PASO 2 — Base de datos (Supabase)
- [x] Crear proyecto `alegria-stereo` en Supabase (ideal: en una cuenta del dueño; la cuenta del usuario
      ya tiene Barbería PRO y el plan gratis permite 2 proyectos)
- [x] Pasar el **Project URL** y la **anon / publishable key** (NUNCA la service_role / secret)
- [x] Correo del dueño para entrar al panel
- [x] Esquema aplicado (12/11/2026): tablas, carpeta de fotos y datos iniciales (2 programas + datos de contacto)
- [x] Permisos probados: el visitante ve programas/ajustes y envía pedidos, pero NO ve pedidos;
      un usuario que no es admin NO puede editar
- [x] es_admin() escondida en el esquema `privado` (0 avisos de seguridad en Supabase)
- [x] `supabase/03-endurecer-permisos.sql` aplicado a mano (0 avisos de rendimiento).
      Ojo: Claude no puede aplicar SQL con `drop`; Supabase pide confirmarlo a mano.
- [x] Usuario del dueño creado y hecho administrador (12/11/2026); probado: puede editar
- [ ] Apagar registros públicos: Authentication → Sign In / Providers → desactivar "Allow new users to sign up"
- [ ] (Opcional) "Leaked password protection" en Authentication (puede requerir plan de pago)

## ✅ PASO 3 — Panel /admin para el dueño (publicado 12/11/2026: alegriastereomusical.com/admin)
Maqueta aprobada: https://claude.ai/artifact/LBiZstp2oRginYpnUYait5
Archivos: `src/pages/admin.astro`, `src/scripts/admin.ts`, `src/styles/admin.css`, `src/lib/`
- [x] Entrar con correo y contraseña (solo el dueño) + "¿Olvidaste tu contraseña?"
- [x] **Cantantes:** agregar, editar, borrar, marcar "Talento de la semana" (foto, nombre, país, género, redes)
- [x] **Programas:** agregar, editar, borrar (nombre, días, hora, duración, descripción, volante)
- [x] **Anuncios / eventos / noticias** con foto: subir y borrar
- [x] **Anunciantes:** logos/banners que el dueño sube y quita
- [x] **Datos de la emisora:** teléfono, correo, redes
- [x] **Pedidos de canciones** guardados en una lista (además de WhatsApp) — probado: se guardan y el público no los ve
- [ ] Inscripciones de talentos a la lista: el dueño decidió dejarlo así por ahora (12/11/2026). Los cuadros de
      Talentos solo abren WhatsApp; la pestaña "Inscripciones de talentos" del panel queda vacía. Las inscripciones
      serían privadas; solo es público lo que el dueño agrega en Cantantes.
- [x] Las fotos se achican solas antes de subirlas (el dueño sube la foto tal cual del celular)
- [x] Colores de la pantalla: Noche / Día / Sol (se recuerda en el teléfono)
- [x] Supabase → Authentication → URL Configuration: Site URL `https://alegriastereomusical.com` y Redirect URL
      `https://alegriastereomusical.com/admin` (para que funcione "¿Olvidaste tu contraseña?")
- [x] Borrar el pedido de prueba "PRUEBA CLAUDE" desde el panel
- [x] Si Supabase falla, la página sigue mostrando la información de respaldo (programas)

## ✅ PASO 4 — La página muestra lo del panel (publicado 12/11/2026)
- [x] "Voces que brillan aquí": Talento de la semana + galería de cantantes (se ve en grande al tocar,
      en el celular se desliza de lado) + botón "¿Quieres estar aquí? Participa"
      → va debajo de Talentos y antes de Pide tu canción
- [x] Anuncios / eventos (se ven hasta el día del evento)
- [x] Espacio para anunciantes (+ botón "¿Quieres anunciar tu negocio aquí?")
- [x] Datos de contacto (teléfono, WhatsApp, correo, redes) que el dueño cambia en el panel
- [x] Programas desde el panel (12/11/2026)
- [x] Facebook y YouTube: aparecen solos cuando el dueño los pone en "Datos de la emisora"

## 💡 Ideas para más adelante (solo si el dueño lo pide)
- [ ] **"Escúchalo otra vez" (pódcast / programas grabados):** sección en la página con episodios o videos, manejada
      desde el panel como los anuncios (el dueño pega el enlace de YouTube o Spotify y se muestra).
      Cómo lo haría la emisora:
      1. Grabar el programa mientras sale al aire (botón "grabar" del programa de emisión, p. ej. BUTT, o Audacity
         conectado a la salida de la consola). Preguntar qué programa usa el dueño para emitir.
      2. Editar: cortar silencios/errores, poner entrada y salida.
      3. **Quitar las canciones completas** (la licencia de la radio en vivo no cubre escucharlas a pedido); dejar
         la conversación: entrevistas, saludos, comentarios.
      4. Subir a una plataforma de pódcast (p. ej. Spotify for Creators, gratis) → se reparte a Spotify, Apple, etc.
      - Video en vivo: celular/cámara en la cabina transmitiendo por Facebook Live, YouTube o TikTok Live mientras
        sale al aire.
      - Lo más prometedor: **Talentos sin Fronteras**. Los artistas cantan sus propias canciones, así que con su
        permiso se puede publicar la presentación completa, y ellos la comparten.
- [ ] Centrar la galería de cantantes cuando hay solo 1–2 (además del Talento de la semana).

---

## 📋 Pendiente que mande el dueño
- [x] Duración de cada programa → el dueño la corrige él mismo en el panel (Programas → Editar)
- [x] Volante de El Viernes Alegre → el dueño lo sube él mismo en el panel (Programas → Editar)
- [x] Facebook / YouTube → el dueño los pone él mismo en el panel (Datos de la emisora)
- [ ] Fotos de los cantantes **con su permiso** → el dueño los agrega él mismo en el panel (Cantantes)
- [ ] Fotos de la cabina y de Robinson Peña
- [x] Su correo para el panel

## 📻 Zeno — fuera de nuestro trabajo (decidido 12/11/2026)
Todo lo de Zeno lo resuelve el dueño por su cuenta: logo en su perfil, si cuenta a los oyentes de nuestra página,
si los anuncios de audio suenan aquí y las licencias de música (según Zeno, sus licencias solo cubren zeno.fm:
https://help.zeno.fm/en/articles/8348796-plans-faq). Ya quedó avisado; no lo seguimos aquí.

## ✔️ Confirmado por el cliente
- [x] Correo: alegriastereomusical@gmail.com
- [x] Instagram: @alalegriastereomusical
- [x] TikTok: @alegriastereomusical
- [x] WhatsApp y teléfono: (809) 420-1033
