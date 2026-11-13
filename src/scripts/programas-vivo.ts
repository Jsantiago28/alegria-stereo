// Trae de Supabase los programas que el dueño maneja desde el panel y los pone en la página.
// Si Supabase no responde, se queda la programación que ya viene escrita en la página (emisora.ts).
import { SUPABASE_URL, CLAVE_PUBLICA } from "../lib/config";
import { otrosPaises, hora12, diasTexto, type Programa } from "../data/emisora";

export type ProgramaVivo = Programa & { volanteUrl?: string | null };

function esc(v: unknown) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
const icono = (d: string, clase: string) =>
  `<svg class="${clase}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  ampliar: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  reloj: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
};
const ordenSemana = (d: number) => (d + 6) % 7; // lunes primero

export async function traerProgramas(): Promise<ProgramaVivo[] | null> {
  try {
    const control = new AbortController();
    const espera = setTimeout(() => control.abort(), 8000);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/programas?select=*&activo=eq.true&order=orden,creado`, {
      headers: { apikey: CLAVE_PUBLICA },
      signal: control.signal,
    });
    clearTimeout(espera);
    if (!r.ok) return null;
    const filas: any[] = await r.json();
    if (!Array.isArray(filas) || !filas.length) return null;
    return filas
      .map((f) => ({
        nombre: f.nombre,
        locutor: f.locutor,
        apodo: f.apodo ?? "",
        dias: f.dias,
        hora: f.hora,
        minuto: f.minuto,
        duracionMin: f.duracion_min,
        lema: f.lema ?? "",
        descripcion: f.descripcion ?? "",
        etiquetas: f.etiquetas ?? [],
        presenta: f.presenta ?? undefined,
        volanteUrl: f.volante_url,
      }))
      .sort((a, b) => Math.min(...a.dias.map(ordenSemana)) - Math.min(...b.dias.map(ordenSemana)) || a.hora - b.hora || a.minuto - b.minuto);
  } catch {
    return null;
  }
}

// Parte de la imagen de cada tarjeta.
function imagenHTML(p: ProgramaVivo, deAntes: Map<string, string>) {
  if (p.volanteUrl) {
    return `<a href="${esc(p.volanteUrl)}" target="_blank" rel="noopener" class="group relative block aspect-[2/3] overflow-hidden bg-noche" aria-label="Ver el volante de ${esc(p.nombre)} en grande">
      <img src="${esc(p.volanteUrl)}" alt="Volante de ${esc(p.nombre)}" loading="lazy" class="size-full object-contain transition duration-700 group-hover:scale-[1.03]">
      <span class="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-noche/80 px-3 py-1.5 text-xs font-semibold backdrop-blur">${icono(IC.ampliar, "size-3.5")} Ver volante</span></a>`;
  }
  // Si el programa ya existía en la página (con su volante o su diseño), se reutiliza esa imagen.
  const anterior = deAntes.get(p.nombre.trim().toLowerCase());
  if (anterior) return anterior;
  const dia = p.dias.length === 1 ? `CADA ${["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"][p.dias[0]]}` : "EN VIVO";
  return `<div class="relative grid aspect-[4/3] place-items-center overflow-hidden md:aspect-auto md:min-h-[26rem] bg-gradient-to-br from-azul via-noche-2 to-noche p-6">
      <div class="relative text-center">
        <p class="font-titulo text-sm tracking-[0.4em] text-oro">${esc(dia)}</p>
        <p class="mt-2 font-titulo text-4xl leading-tight font-black text-white drop-shadow-lg sm:text-5xl">${esc(p.nombre)}</p>
      </div></div>`;
}

function tarjetaHTML(p: ProgramaVivo, i: number, deAntes: Map<string, string>) {
  return `<article class="aparece visto vidrio flex flex-col overflow-hidden rounded-3xl md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" data-programa="${i}">
    ${imagenHTML(p, deAntes)}
    <div class="flex flex-1 flex-col justify-center p-6 sm:p-8 lg:p-10">
      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-oro/15 px-3 py-1 text-xs font-bold tracking-wide text-oro">${icono(IC.calendario, "size-3.5")} ${esc(diasTexto(p.dias).toUpperCase())}</span>
        <span data-al-aire hidden class="en-vivo inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold tracking-wide text-red-300">AL AIRE AHORA</span>
      </div>
      <h3 class="mt-4 font-titulo text-2xl font-bold text-white">${esc(p.nombre)}</h3>
      <p class="text-sm text-suave">con <strong class="text-white">${esc(p.locutor)}</strong>${p.apodo ? `, «${esc(p.apodo)}»` : ""}</p>
      ${p.lema ? `<p class="mt-3 font-semibold text-oro-claro">${esc(p.lema)}</p>` : ""}
      ${p.descripcion ? `<p class="mt-1 text-suave">${esc(p.descripcion)}</p>` : ""}
      ${p.etiquetas.length ? `<ul class="mt-4 flex flex-wrap gap-2">${p.etiquetas.map((e) => `<li class="rounded-full border border-white/10 px-3 py-1 text-xs text-suave">${esc(e)}</li>`).join("")}</ul>` : ""}
      <div class="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-noche/50 p-3 text-center">
        <div><p class="text-[0.65rem] font-bold tracking-widest text-oro">RD</p><p class="font-titulo text-sm font-bold text-white">${esc(hora12(p.hora, p.minuto))}</p><p class="text-[0.7rem] text-suave">Rep. Dom.</p></div>
        ${otrosPaises
          .map(
            (o) =>
              `<div class="border-l border-white/10"><p class="text-[0.65rem] font-bold tracking-widest text-oro">${esc(o.codigo)}</p><p class="font-titulo text-sm font-bold text-white">${esc(
                hora12(p.hora + o.diferencia, p.minuto),
              )}</p><p class="text-[0.7rem] text-suave">${esc(o.pais)}</p></div>`,
          )
          .join("")}
      </div>
      <p class="mt-3 flex items-center gap-1.5 text-sm text-celeste" data-tu-hora hidden>${icono(IC.reloj, "size-4")} <span></span></p>
      ${p.presenta ? `<p class="mt-3 text-xs text-suave">Presenta: ${esc(p.presenta)}</p>` : ""}
    </div></article>`;
}

// Cambia las tarjetas de la sección "Nuestros programas" por las de la base.
export function ponerTarjetas(lista: ProgramaVivo[], nombresDeAntes: string[]) {
  const contenedor = document.querySelector<HTMLElement>("#programacion [data-programa]")?.parentElement;
  if (!contenedor) return;
  const deAntes = new Map<string, string>();
  contenedor.querySelectorAll<HTMLElement>("[data-programa]").forEach((t) => {
    const nombre = nombresDeAntes[Number(t.dataset.programa)];
    const imagen = t.firstElementChild;
    if (nombre && imagen) deAntes.set(nombre.trim().toLowerCase(), imagen.outerHTML);
  });
  contenedor.innerHTML = lista.map((p, i) => tarjetaHTML(p, i, deAntes)).join("");
}
