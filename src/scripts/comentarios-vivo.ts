// Comentarios de los oyentes: muestra los aprobados y envía los nuevos (entran sin aprobar).
import { SUPABASE_URL, CLAVE_PUBLICA } from "../lib/config";

function esc(v: unknown) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Bandera del país (si lo reconocemos).
const CODIGOS: Record<string, string> = {
  "republica dominicana": "DO", "rd": "DO", "dominicana": "DO", "estados unidos": "US", "usa": "US", "eeuu": "US", "ee.uu.": "US",
  "puerto rico": "PR", "mexico": "MX", "peru": "PE", "colombia": "CO", "venezuela": "VE", "espana": "ES", "ecuador": "EC",
  "chile": "CL", "argentina": "AR", "guatemala": "GT", "honduras": "HN", "el salvador": "SV", "nicaragua": "NI",
  "costa rica": "CR", "panama": "PA", "cuba": "CU", "bolivia": "BO", "paraguay": "PY", "uruguay": "UY", "canada": "CA",
  "italia": "IT", "francia": "FR", "alemania": "DE", "suiza": "CH", "reino unido": "GB", "haiti": "HT", "brasil": "BR",
};
function bandera(pais: string | null) {
  if (!pais) return "";
  const clave = pais.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  const codigo = CODIGOS[clave];
  return codigo ? String.fromCodePoint(...[...codigo].map((l) => 0x1f1e6 + l.charCodeAt(0) - 65)) + " " : "";
}

const ESTRELLA = '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8Z"/>';
function estrellasHTML(n: number | null) {
  if (!n) return "";
  return `<p class="flex gap-0.5 text-oro" role="img" aria-label="${n} de 5 estrellas">${[1, 2, 3, 4, 5]
    .map((i) => `<svg class="size-5 ${i <= n ? "" : "opacity-25"}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ESTRELLA}</svg>`)
    .join("")}</p>`;
}

function tarjeta(c: any) {
  return `<li class="vidrio flex flex-col rounded-3xl p-6${c.destacado ? " borde-oro" : ""}">
    ${estrellasHTML(c.estrellas)}
    <p class="mt-3 flex-1 text-lg text-white">«${esc(c.texto)}»</p>
    <p class="mt-4 font-semibold text-oro-claro">${esc(c.nombre)}</p>
    ${c.pais ? `<p class="text-sm text-suave">${bandera(c.pais)}${esc(c.pais)}</p>` : ""}
  </li>`;
}

async function mostrar(seccion: HTMLElement) {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/comentarios?select=nombre,pais,estrellas,texto,destacado&aprobado=eq.true&order=destacado.desc,creado.desc&limit=9`,
      { headers: { apikey: CLAVE_PUBLICA } },
    );
    if (!r.ok) return;
    const filas: any[] = await r.json();
    if (!filas.length) return;
    const lista = seccion.querySelector<HTMLElement>("[data-lista-comentarios]")!;
    lista.innerHTML = filas.map(tarjeta).join("");
    lista.hidden = false;
    seccion.querySelector<HTMLElement>("[data-sin-comentarios]")!.textContent = "Oyentes de varios países nos cuentan lo que sienten al escucharnos.";
  } catch {}
}

export function iniciarComentarios() {
  const seccion = document.getElementById("comentarios");
  if (!seccion) return;
  mostrar(seccion);

  const form = seccion.querySelector<HTMLFormElement>("#form-comentario")!;
  const abrir = seccion.querySelector<HTMLButtonElement>("[data-abrir-comentario]")!;
  const gracias = seccion.querySelector<HTMLElement>("[data-gracias]")!;
  const error = seccion.querySelector<HTMLElement>("[data-error-comentario]")!;
  const texto = form.querySelector<HTMLTextAreaElement>("#com-texto")!;
  let estrellas: number | null = null;

  abrir.addEventListener("click", () => {
    const abierto = form.hidden;
    form.hidden = !abierto;
    gracias.hidden = true;
    abrir.setAttribute("aria-expanded", String(abierto));
    if (abierto) {
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      texto.focus({ preventScroll: true });
    }
  });

  const botonesEstrella = [...form.querySelectorAll<HTMLButtonElement>("[data-estrella]")];
  const pintarEstrellas = () =>
    botonesEstrella.forEach((b) => {
      const n = Number(b.dataset.estrella);
      b.setAttribute("aria-checked", String(n === estrellas));
      b.classList.toggle("text-oro", !!estrellas && n <= estrellas);
      b.classList.toggle("text-suave/40", !estrellas || n > estrellas);
    });
  botonesEstrella.forEach((b) =>
    b.addEventListener("click", () => {
      const n = Number(b.dataset.estrella);
      estrellas = estrellas === n ? null : n; // tocar la misma la quita
      pintarEstrellas();
    }),
  );

  const contador = form.querySelector<HTMLElement>("[data-contador]")!;
  texto.addEventListener("input", () => (contador.textContent = String(texto.value.length)));

  const mostrarError = (msj: string) => {
    error.textContent = msj;
    error.classList.remove("hidden");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    error.classList.add("hidden");
    const datos = new FormData(form);
    const valor = (n: string) => String(datos.get(n) ?? "").trim();
    // Si un robot llenó la trampa, hacemos como que se envió.
    if (valor("web")) {
      form.hidden = true;
      gracias.hidden = false;
      return;
    }
    if (valor("texto").length < 3) return mostrarError("Escribe tu comentario.");
    if (!valor("nombre")) return mostrarError("Escribe tu nombre.");

    const boton = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    boton.disabled = true;
    boton.textContent = "Enviando…";
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/comentarios`, {
        method: "POST",
        headers: { apikey: CLAVE_PUBLICA, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          nombre: valor("nombre").slice(0, 60),
          pais: valor("pais").slice(0, 60) || null,
          estrellas,
          texto: valor("texto").slice(0, 300),
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      form.reset();
      estrellas = null;
      pintarEstrellas();
      contador.textContent = "0";
      form.hidden = true;
      abrir.setAttribute("aria-expanded", "false");
      gracias.hidden = false;
    } catch {
      mostrarError("No se pudo enviar. Revisa tu internet e intenta de nuevo.");
    } finally {
      boton.disabled = false;
      boton.textContent = "Enviar comentario";
    }
  });
}
