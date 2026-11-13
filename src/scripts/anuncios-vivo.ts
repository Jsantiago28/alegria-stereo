// Trae de Supabase los anuncios y eventos que el dueño publica desde el panel.
// - Los eventos se ven hasta el día del evento (al día siguiente se esconden solos).
// - Los anuncios sin fecha se ven hasta que el dueño los oculte o los borre.
// Si no hay anuncios (o Supabase no responde), la sección se queda escondida.
import { SUPABASE_URL, CLAVE_PUBLICA } from "../lib/config";
import { DIFERENCIA_RD } from "../data/emisora";

function esc(v: unknown) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Solo enlaces web normales (nada de "javascript:" ni cosas raras).
function enlaceSeguro(v: string | null) {
  if (!v) return null;
  const texto = v.trim();
  try {
    const url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

const formatoFecha = new Intl.DateTimeFormat("es-DO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

function hoyEnRD() {
  return new Date(Date.now() + DIFERENCIA_RD * 3600_000).toISOString().slice(0, 10); // "AAAA-MM-DD"
}

function tarjeta(a: any) {
  const enlace = enlaceSeguro(a.enlace);
  const fecha = a.fecha_evento ? formatoFecha.format(new Date(`${a.fecha_evento}T00:00:00Z`)) : null;
  const esHoy = a.fecha_evento === hoyEnRD();
  return `<article class="vidrio flex flex-col overflow-hidden rounded-3xl">
    ${
      a.imagen_url
        ? `<a href="${esc(a.imagen_url)}" target="_blank" rel="noopener" class="group block aspect-[4/5] overflow-hidden bg-noche" aria-label="Ver la foto de ${esc(a.titulo)} en grande">
             <img src="${esc(a.imagen_url)}" alt="" loading="lazy" class="size-full object-cover transition duration-700 group-hover:scale-[1.03]"></a>`
        : ""
    }
    <div class="flex flex-1 flex-col p-6">
      ${
        fecha
          ? `<p class="inline-flex self-start rounded-full ${esHoy ? "bg-red-500/20 text-red-200" : "bg-oro/15 text-oro"} px-3 py-1 text-xs font-bold tracking-wide">${esHoy ? "¡HOY! · " : ""}${esc(fecha.toUpperCase())}</p>`
          : ""
      }
      <h3 class="mt-3 font-titulo text-xl font-bold text-white">${esc(a.titulo)}</h3>
      ${a.texto ? `<p class="mt-2 whitespace-pre-line text-suave">${esc(a.texto)}</p>` : ""}
      ${enlace ? `<a href="${esc(enlace)}" target="_blank" rel="noopener" class="boton-linea mt-5 self-start !py-2 text-sm">Más información</a>` : ""}
    </div>
  </article>`;
}

export async function cargarAnuncios() {
  const seccion = document.getElementById("anuncios");
  const lista = seccion?.querySelector<HTMLElement>("[data-lista-anuncios]");
  if (!seccion || !lista) return;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/anuncios?select=*&activo=eq.true&order=creado.desc&limit=50`, {
      headers: { apikey: CLAVE_PUBLICA },
    });
    if (!r.ok) return;
    const filas: any[] = await r.json();
    const hoy = hoyEnRD();
    const vigentes = filas.filter((a) => !a.fecha_evento || a.fecha_evento >= hoy);
    if (!vigentes.length) return;
    // Primero los eventos (el más cercano arriba), luego los anuncios sin fecha (el más nuevo arriba).
    vigentes.sort((a, b) => {
      if (a.fecha_evento && b.fecha_evento) return a.fecha_evento.localeCompare(b.fecha_evento);
      if (a.fecha_evento) return -1;
      if (b.fecha_evento) return 1;
      return b.creado.localeCompare(a.creado);
    });
    lista.innerHTML = vigentes.slice(0, 12).map(tarjeta).join("");
    seccion.hidden = false;
    document.querySelectorAll<HTMLElement>("[data-enlace-anuncios]").forEach((el) => (el.hidden = false));
  } catch {
    // Sin conexión: la sección se queda escondida.
  }
}
