// "Voces que brillan aquí": trae de Supabase los cantantes que el dueño marcó "Mostrar en la página".
// El "Talento de la semana" sale en grande; los demás en una galería. Al tocar uno se abre su ficha.
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

const ICONOS: Record<string, string> = {
  instagram:
    '<rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2"/>',
  facebook: '<path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.33-.04-1.56-.14-2.86-.14C11.94 2 10 3.66 10 6.7v2.8H7v4h3V22h4z"/>',
  youtube:
    '<path d="M21.58 7.19a2.5 2.5 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42a2.5 2.5 0 0 0-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81a2.5 2.5 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.5 2.5 0 0 0 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3z"/>',
  tiktok:
    '<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>',
};
const NOMBRE_RED: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", youtube: "YouTube", tiktok: "TikTok" };

function redesHTML(c: any) {
  const botones = Object.keys(ICONOS)
    .map((red) => {
      const url = enlaceSeguro(c[red]);
      return url
        ? `<a href="${esc(url)}" target="_blank" rel="noopener" aria-label="${NOMBRE_RED[red]} de ${esc(c.nombre)}" class="grid size-11 place-items-center rounded-full border border-white/15 text-white transition hover:border-oro hover:text-oro"><svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONOS[red]}</svg></a>`
        : "";
    })
    .join("");
  return botones ? `<div class="mt-5 flex flex-wrap gap-2">${botones}</div>` : "";
}

const foto = (c: any, clase: string) =>
  c.foto_url
    ? `<img src="${esc(c.foto_url)}" alt="Foto de ${esc(c.nombre)}" loading="lazy" class="${clase} object-cover">`
    : `<div class="${clase} grid place-items-center bg-gradient-to-br from-azul to-noche font-titulo text-5xl font-bold text-white/80">${esc(
        c.nombre.trim().charAt(0).toUpperCase(),
      )}</div>`;
const detalle = (c: any) => [c.pais, c.genero].filter(Boolean).join(" · ");

function destacadoHTML(c: any) {
  return `<article class="vidrio borde-oro grid overflow-hidden rounded-3xl md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
    <button type="button" data-ver="${esc(c.id)}" class="block aspect-square overflow-hidden bg-noche" aria-label="Ver la ficha de ${esc(c.nombre)}">${foto(c, "size-full")}</button>
    <div class="flex flex-col justify-center p-6 sm:p-10">
      <p class="inline-flex items-center gap-2 self-start rounded-full bg-oro px-3 py-1 text-xs font-bold tracking-wide text-noche">
        <svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8Z"/></svg>TALENTO DE LA SEMANA</p>
      <h3 class="mt-4 font-titulo text-3xl font-bold text-white sm:text-4xl">${esc(c.nombre)}</h3>
      ${detalle(c) ? `<p class="mt-1 text-lg text-suave">${esc(detalle(c))}</p>` : ""}
      ${c.frase ? `<p class="mt-4 text-lg text-oro-claro">«${esc(c.frase)}»</p>` : ""}
      ${redesHTML(c)}
    </div>
  </article>`;
}

function itemHTML(c: any) {
  return `<li class="w-[70%] shrink-0 snap-start sm:w-auto">
    <button type="button" data-ver="${esc(c.id)}" class="vidrio group flex w-full flex-col overflow-hidden rounded-3xl text-left transition hover:-translate-y-1 hover:border-oro/50">
      <span class="block aspect-square overflow-hidden">${foto(c, "size-full transition duration-700 group-hover:scale-[1.04]")}</span>
      <span class="block p-4"><span class="block font-semibold text-white">${esc(c.nombre)}</span>${detalle(c) ? `<span class="block text-sm text-suave">${esc(detalle(c))}</span>` : ""}</span>
    </button>
  </li>`;
}

function fichaHTML(c: any) {
  return `${foto(c, "aspect-square w-full")}
    <div class="p-6">
      ${c.destacado ? `<p class="mb-2 text-xs font-bold tracking-widest text-oro">⭐ TALENTO DE LA SEMANA</p>` : ""}
      <h3 class="font-titulo text-2xl font-bold text-white">${esc(c.nombre)}</h3>
      ${detalle(c) ? `<p class="text-suave">${esc(detalle(c))}</p>` : ""}
      ${c.frase ? `<p class="mt-3 text-oro-claro">«${esc(c.frase)}»</p>` : ""}
      ${redesHTML(c)}
    </div>`;
}

export async function cargarCantantes() {
  const seccion = document.getElementById("voces");
  if (!seccion) return;
  let filas: any[];
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cantantes?select=*&activo=eq.true&order=orden,creado`, { headers: { apikey: CLAVE_PUBLICA } });
    if (!r.ok) return;
    filas = await r.json();
  } catch {
    return; // sin conexión: la sección se queda escondida
  }
  if (!Array.isArray(filas) || !filas.length) return;

  const destacado = filas.find((c) => c.destacado);
  const resto = filas.filter((c) => c !== destacado);
  const cajaDestacado = seccion.querySelector<HTMLElement>("[data-destacado]")!;
  const galeria = seccion.querySelector<HTMLElement>("[data-galeria]")!;
  if (destacado) {
    cajaDestacado.innerHTML = destacadoHTML(destacado);
    cajaDestacado.hidden = false;
  }
  galeria.innerHTML = resto.map(itemHTML).join("");
  galeria.hidden = !resto.length;

  const dialogo = seccion.querySelector<HTMLDialogElement>("#ficha-cantante")!;
  seccion.addEventListener("click", (e) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>("[data-ver]")?.dataset.ver;
    const c = id && filas.find((x) => x.id === id);
    if (!c) return;
    dialogo.querySelector<HTMLElement>("[data-ficha]")!.innerHTML = fichaHTML(c);
    dialogo.showModal();
  });
  // Tocar fuera de la ficha la cierra.
  dialogo.addEventListener("click", (e) => {
    if (e.target === dialogo) dialogo.close();
  });

  seccion.hidden = false;
  document.querySelectorAll<HTMLElement>("[data-enlace-voces]").forEach((el) => (el.hidden = false));
}
