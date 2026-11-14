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
- [x] Revisar la vista previa al compartir el enlace por WhatsApp/redes (etiquetas completas 13/11/2026)
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
- [x] Registros públicos apagados (13/11/2026). Probado: Supabase responde "signup_disabled"
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
- [x] Comentarios y reseñas de los oyentes (13/11/2026): nombre, país, estrellas; salen solo cuando el dueño los
      aprueba en el panel (Comentarios → Aprobar / Ocultar / Destacar / Borrar). Tabla: `supabase/04-comentarios.sql`
- [x] Borrar el comentario de prueba "PRUEBA CLAUDE" desde el panel (borrado 13/11/2026)
- [x] Facebook y YouTube: aparecen solos cuando el dueño los pone en "Datos de la emisora"
- [x] Crédito en el pie de página: «Diseño y desarrollo web: Jonathan Santiago» → https://jonathansantiago.pages.dev
- [x] Botón «Instalar la app» (Android, iPhone, Windows, Mac) en la página (arriba, menú del celular y Contacto)
      y «Instalar el panel» en el panel (entrada y menú); el panel se instala aparte como «Panel Alegría»

## 🏁 PASO 5 — Revisión antes de la entrega (lo que valida un programador profesional)
**Yo (Claude)** = lo puede hacer Claude · **Tú** = lo hace Jonathan · **Dueño** = lo hace el cliente

### 🔴 Imprescindible
1. **Seguridad**
   - [x] Reglas de la base probadas (el público no ve pedidos ni comentarios pendientes; nadie edita sin ser admin)
   - [x] En el código solo está la clave pública de Supabase (nunca la secreta)
   - [x] Registros públicos apagados en Supabase (13/11/2026, probado)
   - [x] Contraseña del panel cambiada desde Supabase (SQL Editor) el 13/11/2026; probado: entra con la nueva.
         El correo de "¿Olvidaste tu contraseña?" sí llega (probado); el enlace no se llegó a probar.
2. **Cuentas y propiedad** (dejarlo por escrito; es lo que más problemas da después)
   - [x] Dominio a nombre del dueño (Cloudflare, US$11.17/año, renovación automática)
   - [x] Decidido (13/11/2026): **Cloudflare y GitHub a nombre de Jonathan** (los administra para el mantenimiento);
         **Supabase a nombre de la emisora**. Si el dueño cambia de desarrollador, Jonathan le pasa dominio y código.
   - [x] Lista de cuentas en `docs/entrega.html` (sección 4)
   - [x] Dueño para firma legal: **Robinzon Peña**. ⚠️ El dominio se registró a nombre de «Robinzon Urbaez»:
         confirmar que el nombre del registro del dominio sea el correcto.
   - [x] **Entregado el 13/11/2026, de forma digital.** Precio normal RD$45,000 → **oferta especial RD$18,500**
         (precio especial para Robinzon Peña; ahorro RD$26,500). **3 meses de mantenimiento gratis**; después
         **RD$1,500 por servicio**, solo cuando el dueño lo necesite. En el documento al cliente solo se mencionan
         el dominio (a nombre de Robinzon Peña) y la base de datos (correo de la emisora).
3. **Prueba completa en teléfonos reales**
   - [ ] **Tú:** Android y iPhone: radio suena, botones de WhatsApp, formularios (pedido y comentario)
   - [ ] **Tú + Dueño:** panel desde el celular del dueño: subir foto de la galería, aprobar comentario, cambiar programa
4. **Limpiar pruebas**
   - [x] **Tú:** borrar el comentario "PRUEBA CLAUDE" y cualquier otro dato de prueba (13/11/2026)

### 🟡 Muy recomendable
5. **Google y compartir** (Yo)
   - [x] Vista previa al compartir por WhatsApp/Facebook (logo + nombre)
   - [x] `sitemap` y `robots.txt` para que Google encuentre la página
   - [x] Página 404 bonita
6. **Velocidad y accesibilidad** (Yo)
   - [x] Lighthouse (celular): accesibilidad, buenas prácticas y SEO en 100. Velocidad ~87 en Cloudflare; subir más
         exigiría quitar efectos de diseño (desenfoques y animaciones), se dejó así.
7. **Privacidad** (Yo)
   - [x] Aviso de privacidad en /privacidad (enlaces en el pie y en los formularios)
8. **Supabase gratis se puede pausar** si pasa días sin uso
   - [ ] Saberlo: si un día la página no muestra lo del panel, entrar a Supabase y reactivarlo
9. **Copia de seguridad** (Yo)
   - [x] Primera copia 13/11/2026 en `respaldos/` (no se sube a GitHub). Cómo repetirla: `supabase/COMO-RESPALDAR.md`

### 🟢 La entrega
10. **Manual del dueño** (Yo)
    - [x] `docs/manual-del-dueno.html` con 13 capturas (datos de ejemplo) en `docs/capturas/`
11. **Documento de entrega** (Yo)
    - [x] Se entregan en **PDF**: `docs/pdf/` (Documento de entrega, 7 págs.; Manual del panel, 24 págs.).
          Los .html de `docs/` son la fuente; para regenerar los PDF, pedírselo a Claude.

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
