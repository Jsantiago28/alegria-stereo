// Logos de los anunciantes que el dueño sube en el panel. Si no hay, la sección se queda escondida.
import { SUPABASE_URL, CLAVE_PUBLICA } from "../lib/config";

function esc(v: unknown) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
function enlaceSeguro(v: string | null | undefined) {
  if (!v) return null;
  const texto = v.trim();
  try {
    const url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function logoHTML(a: any) {
  const contenido = `<span class="grid h-28 place-items-center rounded-2xl bg-white p-4">${
    a.logo_url
      ? `<img src="${esc(a.logo_url)}" alt="${esc(a.nombre)}" loading="lazy" class="max-h-full max-w-full object-contain">`
      : `<span class="font-titulo text-lg font-bold text-noche">${esc(a.nombre)}</span>`
  }</span><span class="mt-2 block text-sm font-semibold text-suave">${esc(a.nombre)}</span>`;
  const url = enlaceSeguro(a.enlace);
  return `<li>${
    url
      ? `<a href="${esc(url)}" target="_blank" rel="noopener" class="block rounded-3xl p-2 transition hover:-translate-y-1">${contenido}</a>`
      : `<div class="p-2">${contenido}</div>`
  }</li>`;
}

export async function cargarAnunciantes() {
  const seccion = document.getElementById("anunciantes");
  const lista = seccion?.querySelector<HTMLElement>("[data-logos]");
  if (!seccion || !lista) return;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/anunciantes?select=*&activo=eq.true&order=orden,creado`, { headers: { apikey: CLAVE_PUBLICA } });
    if (!r.ok) return;
    const filas: any[] = await r.json();
    if (!Array.isArray(filas) || !filas.length) return;
    lista.innerHTML = filas.map(logoHTML).join("");
    seccion.hidden = false;
  } catch {
    // Sin conexión: la sección se queda escondida.
  }
}
