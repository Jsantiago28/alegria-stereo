// Panel del administrador de Alegría Stereo.
// Entrar/salir, ver y manejar pedidos, y agregar/editar/borrar cantantes, programas,
// anuncios, anunciantes y los datos de la emisora. Todo se guarda en Supabase.
import { supabase, CARPETA_FOTOS } from "../lib/supabase";
import { emisora, DIFERENCIA_RD, nombresDias, hora12 } from "../data/emisora";
import { instalar, yaInstalada, pasosInstalar } from "./instalar";

/* =====================================================================
   Utilidades
   ===================================================================== */
type Fila = Record<string, any>;

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

// Todo lo que viene de la base (sobre todo lo que escriben los oyentes) se escapa antes de ponerlo en la página.
function esc(v: unknown) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const svg = (d: string, t = 22) =>
  `<svg aria-hidden="true" width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IC = {
  pedidos: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  musica: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  calendario: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  subir: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  luna: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  anuncio: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
  volver: '<path d="M15 18l-6-6 6-6"/>',
};
const ESTRELLA = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21l1.5-7L2 9.3l7-.8z"/></svg>';

function iniciales(nombre: string) {
  return (
    nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "?"
  );
}

const formatoFecha = new Intl.DateTimeFormat("es-DO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
function haceCuanto(fecha: string) {
  const min = Math.round((Date.now() - new Date(fecha).getTime()) / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

/* ---------- Avisos ---------- */
const toast = $("#toast");
let temporizadorToast: number | undefined;
function avisar(texto: string, tipo: "bien" | "mal" = "bien") {
  toast.className = `toast ${tipo}`;
  toast.innerHTML = (tipo === "bien" ? svg(IC.check, 20) : "") + esc(texto);
  toast.hidden = false;
  clearTimeout(temporizadorToast);
  temporizadorToast = window.setTimeout(() => (toast.hidden = true), tipo === "bien" ? 2500 : 6000);
}
const ERROR_RED = "No se pudo guardar. Revisa tu internet e intenta de nuevo.";
const NO_BORRO = "No se pudo borrar. Recarga la página e intenta de nuevo.";

/* ---------- Confirmar antes de borrar ---------- */
const dialogo = $<HTMLDialogElement>("#confirmar");
function confirmar(titulo: string, texto: string): Promise<boolean> {
  $("#confirmar-titulo").textContent = titulo;
  $("#confirmar-texto").textContent = texto;
  dialogo.showModal();
  return new Promise((resolver) => {
    const responder = (e: Event) => {
      const r = (e.target as HTMLElement).closest<HTMLElement>("[data-respuesta]")?.dataset.respuesta;
      if (!r) return;
      dialogo.removeEventListener("click", responder);
      dialogo.close();
      resolver(r === "si");
    };
    dialogo.addEventListener("click", responder);
    dialogo.addEventListener("cancel", () => resolver(false), { once: true });
  });
}

/* =====================================================================
   Colores de la pantalla (Noche / Día / Sol)
   ===================================================================== */
type Tema = "noche" | "dia" | "sol";
const TEMAS: Tema[] = ["noche", "dia", "sol"];
const NOMBRE_TEMA: Record<Tema, string> = { noche: "Noche", dia: "Día", sol: "Sol" };
const COLOR_BARRA: Record<Tema, string> = { noche: "#0a1440", dia: "#ffffff", sol: "#ffffff" };

function temaActual(): Tema {
  const t = document.documentElement.dataset.tema as Tema;
  return TEMAS.includes(t) ? t : "noche";
}
function ponerTema(t: Tema) {
  document.documentElement.dataset.tema = t;
  try {
    localStorage.setItem("tema-panel", t);
  } catch {}
  document.querySelectorAll<HTMLElement>("[data-tema]").forEach((b) => {
    if (b !== document.documentElement) b.setAttribute("aria-checked", String(b.dataset.tema === t));
  });
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLOR_BARRA[t]);
  const siguiente = TEMAS[(TEMAS.indexOf(t) + 1) % 3];
  const rapido = $("#tema-rapido");
  rapido.innerHTML = svg(t === "noche" ? IC.sol : IC.luna);
  rapido.setAttribute("aria-label", `Colores: ${NOMBRE_TEMA[t]}. Tocar para cambiar a ${NOMBRE_TEMA[siguiente]}`);
}
document.querySelectorAll<HTMLElement>("button[data-tema]").forEach((b) =>
  b.addEventListener("click", () => ponerTema(b.dataset.tema as Tema)),
);
$("#tema-rapido").addEventListener("click", () => ponerTema(TEMAS[(TEMAS.indexOf(temaActual()) + 1) % 3]));
ponerTema(temaActual());

/* =====================================================================
   Fotos: se achican en el teléfono antes de subirlas
   ===================================================================== */
const LADO_MAX = 1600;

async function achicar(archivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(bitmap.width * escala);
  lienzo.height = Math.round(bitmap.height * escala);
  lienzo.getContext("2d")!.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
  bitmap.close();
  const comoBlob = (tipo: string) => new Promise<Blob | null>((r) => lienzo.toBlob(r, tipo, 0.82));
  // WebP pesa menos; si el teléfono no sabe hacerlo, JPG.
  const webp = await comoBlob("image/webp");
  if (webp && webp.type === "image/webp") return webp;
  const jpg = await comoBlob("image/jpeg");
  if (!jpg) throw new Error("No se pudo preparar la foto.");
  return jpg;
}

async function subirFoto(archivo: File, carpeta: string): Promise<string> {
  const blob = await achicar(archivo);
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const ruta = `${carpeta}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(CARPETA_FOTOS).upload(ruta, blob, { contentType: blob.type, cacheControl: "31536000" });
  if (error) throw error;
  return supabase.storage.from(CARPETA_FOTOS).getPublicUrl(ruta).data.publicUrl;
}

function rutaDeFoto(url: string | null | undefined) {
  const marca = `/storage/v1/object/public/${CARPETA_FOTOS}/`;
  return url && url.includes(marca) ? decodeURIComponent(url.split(marca)[1]!) : null;
}
async function borrarFotos(urls: (string | null | undefined)[]) {
  const rutas = urls.map(rutaDeFoto).filter((r): r is string => !!r);
  if (rutas.length) await supabase.storage.from(CARPETA_FOTOS).remove(rutas);
}

/* =====================================================================
   Programas: próximo programa (misma cuenta que la página pública)
   ===================================================================== */
const HORA = 3600_000;
function proximoPrograma(programas: Fila[]) {
  const ahora = Date.now();
  const rd = new Date(ahora + DIFERENCIA_RD * HORA);
  const turnos: { p: Fila; inicio: number; fin: number }[] = [];
  programas
    .filter((p) => p.activo)
    .forEach((p) => {
      for (let d = -1; d <= 7; d++) {
        const reloj = Date.UTC(rd.getUTCFullYear(), rd.getUTCMonth(), rd.getUTCDate() + d, p.hora, p.minuto);
        if (!p.dias.includes(new Date(reloj).getUTCDay())) continue;
        const inicio = reloj - DIFERENCIA_RD * HORA;
        turnos.push({ p, inicio, fin: inicio + p.duracion_min * 60_000 });
      }
    });
  turnos.sort((a, b) => a.inicio - b.inicio);
  const actual = turnos.find((t) => ahora >= t.inicio && ahora < t.fin);
  if (actual) return { ...actual, alAire: true };
  const sig = turnos.find((t) => t.inicio > ahora);
  return sig ? { ...sig, alAire: false } : null;
}
function faltan(ms: number) {
  const min = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  if (d > 0) return `${d} ${d === 1 ? "día" : "días"} y ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}
const LETRA_DIA = ["D", "L", "M", "M", "J", "V", "S"];
const CORTO_DIA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const ordenSemana = (d: number) => (d + 6) % 7; // lunes primero
function diasChip(p: Fila) {
  const dias = [...p.dias].sort((a: number, b: number) => ordenSemana(a) - ordenSemana(b));
  return `${dias.map((d: number) => CORTO_DIA[d]).join(", ")} · ${hora12(p.hora, p.minuto)}`;
}
function duracionTexto(min: number) {
  if (min % 60 === 0) return `${min / 60} ${min === 60 ? "hora" : "horas"}`;
  if (min > 60) return `${Math.floor(min / 60)} h ${min % 60} min`;
  return `${min} min`;
}

/* =====================================================================
   Datos en memoria
   ===================================================================== */
const datos: Record<string, Fila[]> = { programas: [], cantantes: [], anuncios: [], anunciantes: [], pedidos: [], comentarios: [] };
let ajustes: Fila | null = null;
let cargado: Record<string, boolean> = {};

async function cargar(tabla: string) {
  const consulta = supabase.from(tabla).select("*");
  const { data, error } =
    tabla === "anuncios" || tabla === "pedidos" || tabla === "comentarios"
      ? await consulta.order("creado", { ascending: false }).limit(300)
      : await consulta.order("orden").order("creado");
  if (error) throw error;
  datos[tabla] = data ?? [];
  cargado[tabla] = true;
  if (tabla === "pedidos") ponerInsignia("pedidos", datos.pedidos.filter((p) => !p.atendido).length);
  if (tabla === "comentarios") ponerInsignia("comentarios", datos.comentarios.filter((c) => !c.revisado).length);
}
async function cargarAjustes() {
  const { data, error } = await supabase.from("ajustes").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  ajustes = data;
}

// Números de pendientes: pedidos sin atender y comentarios sin revisar. La campana muestra la suma.
const pendientes = { pedidos: 0, comentarios: 0 };
function ponerInsignia(cual: "pedidos" | "comentarios", n: number) {
  pendientes[cual] = n;
  const total = pendientes.pedidos + pendientes.comentarios;
  const poner = (sel: string, v: number) =>
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      el.textContent = v > 99 ? "99+" : String(v);
      el.hidden = v === 0;
    });
  poner(`[data-insignia="${cual}"]`, n);
  poner('[data-insignia="total"]', total);
  const partes = [
    pendientes.pedidos && `${pendientes.pedidos} ${pendientes.pedidos === 1 ? "pedido nuevo" : "pedidos nuevos"}`,
    pendientes.comentarios && `${pendientes.comentarios} ${pendientes.comentarios === 1 ? "comentario" : "comentarios"} por revisar`,
  ].filter(Boolean);
  $("#campana").setAttribute("aria-label", partes.length ? `Pendientes: ${partes.join(" y ")}` : "Sin pendientes");
}
async function contarPendientes() {
  const [p, c] = await Promise.all([
    supabase.from("pedidos").select("id", { count: "exact", head: true }).eq("atendido", false),
    supabase.from("comentarios").select("id", { count: "exact", head: true }).eq("revisado", false),
  ]);
  if (typeof p.count === "number") ponerInsignia("pedidos", p.count);
  if (typeof c.count === "number") ponerInsignia("comentarios", c.count);
}

/* =====================================================================
   Formularios: definición de los campos de cada sección
   ===================================================================== */
type Campo = {
  k: string;
  tipo: "texto" | "area" | "foto" | "dias" | "hora" | "duracion" | "interruptor" | "fecha" | "etiquetas" | "numero-wa";
  etiqueta: string;
  max?: number;
  req?: boolean;
  ayuda?: string;
  ph?: string;
  defecto?: unknown;
};
type Coleccion = {
  tabla: string;
  titulo: string;
  singular: string;
  descripcion: string;
  carpeta: string;
  campos: Campo[];
  nombre: (f: Fila) => string;
  tarjeta: (f: Fila) => string;
  disposicion: "cuadricula" | "renglones";
  orden?: (a: Fila, b: Fila) => number;
  vacio: string;
};

const mostrar: Campo = { k: "activo", tipo: "interruptor", etiqueta: "Mostrar en la página", ayuda: "Si lo apagas, se oculta sin borrarlo.", defecto: true };

const botonesFila = (f: Fila) =>
  `<button class="boton-linea" data-accion="editar" data-id="${esc(f.id)}">Editar</button><button class="boton-peligro" data-accion="borrar" data-id="${esc(f.id)}">Borrar</button>`;
const marcaOculto = (f: Fila) => (f.activo ? "" : ` <span class="chip chip-gris">Oculto</span>`);

const colecciones: Record<string, Coleccion> = {
  cantantes: {
    tabla: "cantantes",
    titulo: "Cantantes",
    singular: "cantante",
    descripcion: "Salen en «Voces que brillan aquí». La estrella marca al Talento de la semana.",
    carpeta: "cantantes",
    disposicion: "cuadricula",
    vacio: "Todavía no hay cantantes. Toca «Agregar cantante» para poner el primero.",
    nombre: (f) => f.nombre,
    campos: [
      { k: "foto_url", tipo: "foto", etiqueta: "Foto del cantante" },
      { k: "nombre", tipo: "texto", etiqueta: "Nombre artístico", req: true, max: 80, ph: "Ej.: María López" },
      { k: "pais", tipo: "texto", etiqueta: "País", max: 60, ph: "Ej.: Rep. Dominicana" },
      { k: "genero", tipo: "texto", etiqueta: "Género", max: 60, ph: "Ej.: Bachata" },
      { k: "frase", tipo: "area", etiqueta: "Frase corta", max: 200, ph: "Algo que lo describa en una línea" },
      { k: "instagram", tipo: "texto", etiqueta: "Instagram", max: 200, ph: "Enlace de su perfil" },
      { k: "facebook", tipo: "texto", etiqueta: "Facebook", max: 200, ph: "Enlace de su página" },
      { k: "youtube", tipo: "texto", etiqueta: "YouTube", max: 200, ph: "Enlace de su canal" },
      { k: "tiktok", tipo: "texto", etiqueta: "TikTok", max: 200, ph: "Enlace de su perfil" },
      { k: "destacado", tipo: "interruptor", etiqueta: "Talento de la semana", ayuda: "Solo puede haber uno: se le quita al anterior.", defecto: false },
      mostrar,
    ],
    tarjeta: (f) => `
      <div class="tarjeta ficha${f.activo ? "" : " oculto"}">
        <div class="foto-redonda">${f.foto_url ? `<img src="${esc(f.foto_url)}" alt="" loading="lazy">` : "Sin foto"}${
          f.destacado ? `<span class="estrella" title="Talento de la semana">${ESTRELLA}<span class="solo-lector">Talento de la semana</span></span>` : ""
        }</div>
        <div class="nom">${esc(f.nombre)}</div>
        <div class="mut" style="font-size:14px">${esc([f.pais, f.genero].filter(Boolean).join(" · "))}${marcaOculto(f)}</div>
        <div class="acciones-ficha">${botonesFila(f)}</div>
      </div>`,
  },
  programas: {
    tabla: "programas",
    titulo: "Programas",
    singular: "programa",
    descripcion: "La página calcula sola «Al aire ahora», el próximo programa y las horas de otros países.",
    carpeta: "volantes",
    disposicion: "renglones",
    vacio: "No hay programas todavía.",
    nombre: (f) => f.nombre,
    orden: (a, b) => Math.min(...a.dias.map(ordenSemana)) - Math.min(...b.dias.map(ordenSemana)) || a.hora - b.hora || a.minuto - b.minuto,
    campos: [
      { k: "nombre", tipo: "texto", etiqueta: "Nombre del programa", req: true, max: 80, ph: "Ej.: Domingo Romántico" },
      { k: "dias", tipo: "dias", etiqueta: "¿Qué días sale?", req: true },
      { k: "hora", tipo: "hora", etiqueta: "Hora en que empieza (hora de RD)", req: true, defecto: "20:00" },
      { k: "duracion_min", tipo: "duracion", etiqueta: "Duración", defecto: 120 },
      { k: "locutor", tipo: "texto", etiqueta: "Locutor", req: true, max: 80, defecto: "Robinson Peña" },
      { k: "apodo", tipo: "texto", etiqueta: "Apodo del locutor", max: 80, defecto: "El Maestro del Amor" },
      { k: "lema", tipo: "texto", etiqueta: "Lema", max: 160, ph: "Una frase corta del programa" },
      { k: "descripcion", tipo: "area", etiqueta: "Descripción", max: 600, ph: "De qué trata el programa" },
      { k: "etiquetas", tipo: "etiquetas", etiqueta: "Temas del programa", ayuda: "Sepáralos con comas. Ej.: Merengue, Alegría, Música" },
      { k: "presenta", tipo: "texto", etiqueta: "Lo presenta (emisora aliada)", max: 80, ph: "Ej.: Radio Music Digital 105.7" },
      { k: "volante_url", tipo: "foto", etiqueta: "Volante del programa" },
      mostrar,
    ],
    tarjeta: (f) => `
      <div class="tarjeta renglon${f.activo ? "" : " oculto"}">
        <span class="chip chip-oro">${esc(diasChip(f))}</span>
        <div class="cuerpo-fila"><div class="nom">${esc(f.nombre)}${marcaOculto(f)}</div><div class="mut" style="font-size:14px">${esc(f.locutor)} · ${esc(duracionTexto(f.duracion_min))}</div></div>
        <div class="botones">${botonesFila(f)}</div>
      </div>`,
  },
  anuncios: {
    tabla: "anuncios",
    titulo: "Anuncios y eventos",
    singular: "anuncio",
    descripcion: "Noticias, eventos y avisos que salen en la página.",
    carpeta: "anuncios",
    disposicion: "renglones",
    vacio: "Todavía no hay anuncios. Cuando publiques uno, aparecerá aquí y en la página.",
    nombre: (f) => f.titulo,
    campos: [
      { k: "titulo", tipo: "texto", etiqueta: "Título", req: true, max: 120, ph: "Ej.: Gran noche de talentos" },
      { k: "texto", tipo: "area", etiqueta: "Texto", max: 1000, ph: "Los detalles del anuncio" },
      { k: "fecha_evento", tipo: "fecha", etiqueta: "Fecha del evento" },
      { k: "imagen_url", tipo: "foto", etiqueta: "Foto del anuncio" },
      { k: "enlace", tipo: "texto", etiqueta: "Enlace", max: 300, ph: "Para más información (opcional)" },
      mostrar,
    ],
    tarjeta: (f) => `
      <div class="tarjeta renglon${f.activo ? "" : " oculto"}">
        ${f.imagen_url ? `<img class="miniatura" src="${esc(f.imagen_url)}" alt="" loading="lazy">` : ""}
        <div class="cuerpo-fila"><div class="nom">${esc(f.titulo)}${marcaOculto(f)}</div><div class="mut" style="font-size:14px">${
          f.fecha_evento ? `Evento: ${esc(formatoFecha.format(new Date(f.fecha_evento)))}` : `Publicado ${esc(haceCuanto(f.creado))}`
        }</div></div>
        <div class="botones">${botonesFila(f)}</div>
      </div>`,
  },
  anunciantes: {
    tabla: "anunciantes",
    titulo: "Anunciantes",
    singular: "anunciante",
    descripcion: "Logos de los negocios que patrocinan la emisora.",
    carpeta: "anunciantes",
    disposicion: "cuadricula",
    vacio: "Todavía no hay anunciantes. Toca «Agregar anunciante» para poner el primero.",
    nombre: (f) => f.nombre,
    campos: [
      { k: "logo_url", tipo: "foto", etiqueta: "Logo o banner" },
      { k: "nombre", tipo: "texto", etiqueta: "Nombre del negocio", req: true, max: 80, ph: "Ej.: Colmado La Esquina" },
      { k: "enlace", tipo: "texto", etiqueta: "Enlace", max: 300, ph: "Su página, Instagram o WhatsApp (opcional)" },
      mostrar,
    ],
    tarjeta: (f) => `
      <div class="tarjeta ficha${f.activo ? "" : " oculto"}">
        <div class="logo-caja">${f.logo_url ? `<img src="${esc(f.logo_url)}" alt="" loading="lazy">` : "Sin logo"}</div>
        <div class="nom">${esc(f.nombre)}</div>${f.activo ? "" : `<span class="chip chip-gris">Oculto</span>`}
        <div class="acciones-ficha">${botonesFila(f)}</div>
      </div>`,
  },
};

const camposAjustes: Campo[] = [
  { k: "telefono", tipo: "texto", etiqueta: "Teléfono", max: 30, ph: "(809) 000-0000" },
  { k: "whatsapp", tipo: "numero-wa", etiqueta: "WhatsApp", ayuda: "Solo números, con el 1 delante. Ej.: 18094201033" },
  { k: "correo", tipo: "texto", etiqueta: "Correo", max: 120 },
  { k: "instagram", tipo: "texto", etiqueta: "Instagram", max: 200, ph: "Enlace del perfil" },
  { k: "tiktok", tipo: "texto", etiqueta: "TikTok", max: 200, ph: "Enlace del perfil" },
  { k: "facebook", tipo: "texto", etiqueta: "Facebook", max: 200, ph: "Cuando lo tengas" },
  { k: "youtube", tipo: "texto", etiqueta: "YouTube", max: 200, ph: "Cuando lo tengas" },
];

/* ---------- Dibujar un campo ---------- */
// Fotos elegidas en el formulario abierto (todavía sin subir).
let fotosElegidas: Record<string, { archivo?: File; quitar?: boolean; vista?: string }> = {};

function campoHTML(c: Campo, f: Fila | null) {
  const id = `c-${c.k}`;
  const valor = f ? f[c.k] : c.defecto;
  const opc = c.req ? "" : ` <span class="opc">(opcional)</span>`;
  const ayuda = c.ayuda ? `<p class="ayuda">${esc(c.ayuda)}</p>` : "";
  const err = `<p class="error-campo" data-error="${c.k}" hidden></p>`;
  const max = c.max ? ` maxlength="${c.max}"` : "";
  switch (c.tipo) {
    case "texto":
    case "numero-wa":
      return `<div><label class="etiqueta" for="${id}">${esc(c.etiqueta)}${opc}</label><input id="${id}" name="${c.k}" class="entrada"${max} value="${esc(valor)}" placeholder="${esc(c.ph)}"${
        c.tipo === "numero-wa" ? ' inputmode="numeric"' : ""
      }>${ayuda}${err}</div>`;
    case "area":
      return `<div><label class="etiqueta" for="${id}">${esc(c.etiqueta)}${opc}</label><textarea id="${id}" name="${c.k}" class="entrada" rows="3"${max} placeholder="${esc(c.ph)}">${esc(valor)}</textarea>${ayuda}${err}</div>`;
    case "etiquetas":
      return `<div><label class="etiqueta" for="${id}">${esc(c.etiqueta)}${opc}</label><input id="${id}" name="${c.k}" class="entrada" value="${esc((valor ?? []).join(", "))}">${ayuda}${err}</div>`;
    case "fecha":
      return `<div><label class="etiqueta" for="${id}">${esc(c.etiqueta)}${opc}</label><input id="${id}" name="${c.k}" type="date" class="entrada" value="${esc(valor ?? "")}">${ayuda}${err}</div>`;
    case "hora": {
      const v = f ? `${String(f.hora).padStart(2, "0")}:${String(f.minuto).padStart(2, "0")}` : String(c.defecto ?? "");
      return `<div><label class="etiqueta" for="${id}">${esc(c.etiqueta)}</label><input id="${id}" name="${c.k}" type="time" class="entrada" value="${esc(v)}">${ayuda}${err}</div>`;
    }
    case "duracion": {
      const v = Number(valor ?? 120);
      const opciones = [30, 60, 90, 120, 150, 180, 240, 300];
      if (!opciones.includes(v)) opciones.push(v);
      return `<div><label class="etiqueta" for="${id}">${esc(c.etiqueta)}</label><select id="${id}" name="${c.k}" class="entrada">${opciones
        .sort((a, b) => a - b)
        .map((o) => `<option value="${o}"${o === v ? " selected" : ""}>${duracionTexto(o)}</option>`)
        .join("")}</select>${err}</div>`;
    }
    case "dias": {
      const marcados: number[] = valor ?? [];
      return `<div><div class="etiqueta" id="${id}">${esc(c.etiqueta)}</div><div class="dias" role="group" aria-labelledby="${id}">${[1, 2, 3, 4, 5, 6, 0]
        .map((d) => `<button type="button" data-dia="${d}" aria-pressed="${marcados.includes(d)}" aria-label="${nombresDias[d]}">${LETRA_DIA[d]}</button>`)
        .join("")}</div>${err}</div>`;
    }
    case "interruptor":
      return `<button type="button" class="interruptor" role="switch" data-switch="${c.k}" aria-checked="${!!valor}"><span><span style="display:block">${esc(c.etiqueta)}</span>${
        c.ayuda ? `<span class="ayuda" style="display:block">${esc(c.ayuda)}</span>` : ""
      }</span><span class="riel" aria-hidden="true"></span></button>`;
    case "foto":
      return `<div data-foto="${c.k}"><div class="etiqueta">${esc(c.etiqueta)}${opc}</div>
        <label class="subir">${svg(IC.subir, 26)}<span><span class="t">Elegir foto</span><span class="s">De la galería o la cámara. Se achica sola.</span></span><input type="file" accept="image/*" data-archivo="${c.k}"></label>
        <div class="vista-foto" data-vista="${c.k}"${valor ? "" : " hidden"}><img src="${esc(valor ?? "")}" alt="Foto elegida"><button type="button" class="boton-peligro" data-quitar-foto="${c.k}">Quitar foto</button></div>${err}</div>`;
  }
}

/* ---------- Leer el formulario ---------- */
function leerFormulario(form: HTMLFormElement, campos: Campo[]) {
  const valores: Fila = {};
  const errores: { k: string; msj: string }[] = [];
  for (const c of campos) {
    const el = form.querySelector<HTMLInputElement>(`[name="${c.k}"]`);
    switch (c.tipo) {
      case "texto":
      case "area": {
        const v = el!.value.trim();
        if (c.req && !v) errores.push({ k: c.k, msj: "Este dato es obligatorio." });
        valores[c.k] = v || null;
        break;
      }
      case "numero-wa": {
        const v = el!.value.replace(/\D/g, "");
        if (v && !/^[0-9]{8,15}$/.test(v)) errores.push({ k: c.k, msj: "Escribe el número completo, solo números (8 a 15)." });
        valores[c.k] = v || null;
        break;
      }
      case "etiquetas":
        valores[c.k] = el!.value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 12);
        break;
      case "fecha":
        valores[c.k] = el!.value || null;
        break;
      case "hora": {
        const [h, m] = el!.value.split(":").map(Number);
        if (!el!.value || Number.isNaN(h)) errores.push({ k: c.k, msj: "Elige la hora." });
        valores.hora = h;
        valores.minuto = m || 0;
        break;
      }
      case "duracion":
        valores[c.k] = Number((form.querySelector(`[name="${c.k}"]`) as HTMLSelectElement).value);
        break;
      case "dias": {
        const dias = [...form.querySelectorAll<HTMLElement>('[data-dia][aria-pressed="true"]')].map((b) => Number(b.dataset.dia));
        if (c.req && !dias.length) errores.push({ k: c.k, msj: "Marca al menos un día." });
        valores[c.k] = dias.sort((a, b) => a - b);
        break;
      }
      case "interruptor":
        valores[c.k] = form.querySelector(`[data-switch="${c.k}"]`)!.getAttribute("aria-checked") === "true";
        break;
    }
  }
  return { valores, errores };
}

function mostrarErrores(form: HTMLFormElement, errores: { k: string; msj: string }[]) {
  form.querySelectorAll<HTMLElement>("[data-error]").forEach((e) => (e.hidden = true));
  for (const { k, msj } of errores) {
    const e = form.querySelector<HTMLElement>(`[data-error="${k}"]`);
    if (e) {
      e.textContent = msj;
      e.hidden = false;
    }
  }
  if (errores.length) {
    const primero = form.querySelector<HTMLElement>(`[name="${errores[0].k}"], [data-error="${errores[0].k}"]`);
    primero?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (primero instanceof HTMLInputElement || primero instanceof HTMLTextAreaElement) primero.focus();
  }
}

/* =====================================================================
   Navegación (#seccion, #seccion/nuevo, #seccion/<id>)
   ===================================================================== */
const SECCIONES = ["inicio", "pedidos", "comentarios", "cantantes", "programas", "anuncios", "anunciantes", "datos"];
const contenido = $("#contenido");
let pestanaPedidos: "cancion" | "talento" = "cancion";
let pestanaComentarios: "revisar" | "publicados" | "ocultos" = "revisar";

function ir(ruta: string) {
  if (location.hash === `#${ruta}`) dibujar();
  else location.hash = ruta;
}

async function dibujar() {
  const [sec = "inicio", sub] = location.hash.slice(1).split("/");
  const seccion = SECCIONES.includes(sec) ? sec : "inicio";
  document.querySelectorAll<HTMLElement>("[data-ir]").forEach((b) => {
    if (b.dataset.ir === seccion) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  cerrarMenu();
  fotosElegidas = {};
  try {
    if (seccion === "inicio") await dibujarInicio();
    else if (seccion === "pedidos") await dibujarPedidos();
    else if (seccion === "comentarios") await dibujarComentarios();
    else if (seccion === "datos") await dibujarDatos();
    else {
      const col = colecciones[seccion];
      if (!cargado[col.tabla]) {
        contenido.innerHTML = `<p class="cargando-texto">Cargando…</p>`;
        await cargar(col.tabla);
      }
      if (sub === "nuevo") dibujarFormulario(col, null);
      else if (sub) {
        const fila = datos[col.tabla].find((f) => f.id === sub);
        if (fila) dibujarFormulario(col, fila);
        else return ir(seccion);
      } else dibujarLista(col);
    }
  } catch {
    contenido.innerHTML = `<div class="tarjeta vacio"><div class="t">No se pudo cargar la información</div><p>Revisa tu internet.</p><button class="boton" data-accion="reintentar">Intentar de nuevo</button></div>`;
  }
  window.scrollTo({ top: 0 });
  contenido.focus({ preventScroll: true });
}

/* ---------- Inicio ---------- */
/* ---------- Escuchar la radio dentro del panel ---------- */
const radio = new Audio();
radio.preload = "none";
let estadoRadio: "parado" | "cargando" | "sonando" = "parado";
const IC_PLAY = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z"/></svg>';
const IC_PAUSA = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4.5" height="15" rx="1.2"/><rect x="13.5" y="4.5" width="4.5" height="15" rx="1.2"/></svg>';

function botonRadioHTML() {
  const sonando = estadoRadio !== "parado";
  return `<button id="boton-radio" class="boton" data-accion="radio" aria-pressed="${sonando}" aria-label="${sonando ? "Pausar la radio" : "Escuchar la radio"}" style="width:52px;height:52px;padding:0;border-radius:50%;flex:none">${
    estadoRadio === "cargando" ? svg('<path d="M21 12a9 9 0 1 1-6.22-8.56"/>') : sonando ? IC_PAUSA : IC_PLAY
  }</button>`;
}
function ponerEstadoRadio(e: typeof estadoRadio) {
  estadoRadio = e;
  const b = document.getElementById("boton-radio");
  if (b) b.outerHTML = botonRadioHTML();
  // Arriba, junto a la campana: botón de pausa mientras suena (para pararla desde cualquier sección).
  const arriba = $("#radio-cabecera");
  arriba.hidden = e === "parado";
  arriba.innerHTML = e === "cargando" ? svg('<path d="M21 12a9 9 0 1 1-6.22-8.56"/>') : IC_PAUSA;
}
$("#radio-cabecera").addEventListener("click", alternarRadio);
async function alternarRadio() {
  if (estadoRadio !== "parado") {
    radio.pause();
    radio.removeAttribute("src");
    radio.load(); // corta la descarga de la señal
    return ponerEstadoRadio("parado");
  }
  ponerEstadoRadio("cargando");
  radio.src = emisora.stream; // señal en vivo: se conecta de nuevo para oír lo de ahora
  try {
    await radio.play();
  } catch (e) {
    if ((e as DOMException)?.name === "AbortError") return;
    ponerEstadoRadio("parado");
    avisar("No se pudo conectar con la radio. Intenta de nuevo.", "mal");
  }
}
radio.addEventListener("playing", () => ponerEstadoRadio("sonando"));
radio.addEventListener("waiting", () => {
  if (radio.getAttribute("src")) ponerEstadoRadio("cargando");
});
radio.addEventListener("error", () => {
  if (!radio.getAttribute("src")) return;
  ponerEstadoRadio("parado");
  avisar("Se perdió la conexión con la radio. Dale play otra vez.", "mal");
});

let fuenteSonando: EventSource | null = null;
let ultimaCancion = "";
function escucharSonando() {
  if (fuenteSonando || !("EventSource" in window)) return;
  fuenteSonando = new EventSource(emisora.sonandoAhora);
  fuenteSonando.addEventListener("message", (e) => {
    try {
      const t = String(JSON.parse(e.data).streamTitle ?? "").trim();
      if (!t) return;
      ultimaCancion = t;
      const el = document.getElementById("sonando");
      if (el) el.textContent = t;
    } catch {}
  });
}

async function dibujarInicio() {
  if (!cargado.programas || !cargado.cantantes || !cargado.pedidos) {
    contenido.innerHTML = `<p class="cargando-texto">Cargando…</p>`;
    await Promise.all(["programas", "cantantes", "pedidos"].map((t) => (cargado[t] ? null : cargar(t))));
  }
  escucharSonando();
  const nuevos = datos.pedidos.filter((p) => !p.atendido);
  const ultimo = nuevos[0];
  const prox = proximoPrograma(datos.programas);
  const talento = datos.cantantes.find((c) => c.destacado);
  const programas = [...datos.programas].filter((p) => p.activo).sort(colecciones.programas.orden!);

  contenido.innerHTML = `
    <div class="encabezado"><div><h1 class="titulo-fuente">Inicio</h1><p>Hola, Robinson. Esto es lo que pasa hoy en la emisora.</p></div></div>
    <div class="stats">
      <button class="tarjeta stat" data-accion="ir" data-ruta="pedidos" style="text-align:left;cursor:pointer;color:inherit">
        <span class="ic">${svg(IC.pedidos, 26)}</span>
        <span style="min-width:0"><span class="et" style="display:block">Pedidos nuevos</span><span class="num" style="display:block">${nuevos.length}</span>
        <span class="det" style="display:block">${ultimo ? `Último: ${esc(ultimo.cancion || ultimo.nombre)}` : "No hay pedidos sin atender"}</span></span>
      </button>
      <div class="tarjeta stat">
        <span class="ic">${svg(IC.reloj, 26)}</span>
        <div style="min-width:0">${
          prox
            ? `<div class="et">${prox.alAire ? "Al aire ahora" : "Próximo programa"}</div><div class="grande">${esc(prox.p.nombre)}</div>
               <div class="det">${esc(nombresDias[new Date(prox.inicio + DIFERENCIA_RD * HORA).getUTCDay()])} · ${esc(hora12(prox.p.hora, prox.p.minuto))} (RD)</div>
               <div class="cuenta">${prox.alAire ? `Termina en ${faltan(prox.fin - Date.now())}` : `Faltan ${faltan(prox.inicio - Date.now())}`}</div>`
            : `<div class="et">Próximo programa</div><div class="det">No hay programas activos.</div>`
        }</div>
      </div>
      <div class="tarjeta stat">
        <div class="foto-redonda">${talento?.foto_url ? `<img src="${esc(talento.foto_url)}" alt="">` : "Foto"}</div>
        <div style="min-width:0"><div class="et">Talento de la semana</div>${
          talento
            ? `<div class="grande">${esc(talento.nombre)}</div><div class="det">${esc([talento.pais, talento.genero].filter(Boolean).join(" · "))}</div>`
            : `<div class="det">Aún no hay. Márcalo con la estrella en Cantantes.</div>`
        }</div>
      </div>
    </div>
    <div class="columnas">
      <div class="columna">
        <section class="tarjeta panelito">
          <h2>${svg(IC.musica)}Sonando ahora</h2>
          <p class="nota">La misma radio que se escucha en la página. Sigue sonando aunque cambies de sección.</p>
          <div class="fila">${botonRadioHTML()}<div class="cuerpo-fila"><div class="nom" id="sonando">${esc(ultimaCancion || "Conectando con la radio…")}</div></div><span class="chip chip-ok">● Al aire</span></div>
        </section>
        <section class="tarjeta panelito">
          <h2>${svg(IC.calendario)}Programación de la semana</h2>
          <div class="filas">${
            programas.length
              ? programas
                  .map(
                    (p) =>
                      `<div class="fila"><span class="chip chip-oro">${esc(diasChip(p))}</span><div class="cuerpo-fila nom">${esc(p.nombre)}</div>${
                        prox && prox.p.id === p.id ? `<span class="chip chip-ok">${prox.alAire ? "Al aire" : "Próximo"}</span>` : ""
                      }</div>`,
                  )
                  .join("")
              : `<p class="mut">No hay programas activos.</p>`
          }</div>
          <button class="boton" style="align-self:flex-end" data-accion="ir" data-ruta="programas/nuevo">${svg(IC.mas, 20)}Nuevo programa</button>
        </section>
      </div>
      <div class="columna">
        <section class="tarjeta panelito">
          <h2>${svg(IC.pedidos)}Últimos pedidos</h2>
          <div class="filas">${
            nuevos.length
              ? nuevos
                  .slice(0, 3)
                  .map(
                    (p) =>
                      `<div class="fila"><div class="avatar">${esc(iniciales(p.nombre))}</div><div class="cuerpo-fila"><div style="display:flex;justify-content:space-between;gap:8px"><span class="nom">${esc(
                        p.nombre,
                      )}</span><span class="mut" style="font-size:13px;white-space:nowrap">${esc(haceCuanto(p.creado))}</span></div><div class="det">${esc(resumenPedido(p))}</div></div></div>`,
                  )
                  .join("")
              : `<p class="mut">No hay pedidos nuevos.</p>`
          }</div>
          <button class="enlace-boton" data-accion="ir" data-ruta="pedidos">Ver todos los pedidos →</button>
        </section>
        <section class="tarjeta panelito">
          <h2>Acciones rápidas</h2>
          <div class="rapidas">
            <button class="boton" data-accion="ir" data-ruta="cantantes/nuevo">${svg(IC.mas)}Cantante</button>
            <button class="boton" data-accion="ir" data-ruta="anuncios/nuevo">${svg(IC.mas)}Anuncio</button>
            <button class="boton-linea" data-accion="ir" data-ruta="pedidos">Ver pedidos</button>
            <button class="boton-linea" data-accion="ir" data-ruta="programas">Programas</button>
          </div>
        </section>
      </div>
    </div>`;
}

/* ---------- Pedidos ---------- */
function resumenPedido(p: Fila) {
  if (p.tipo === "talento") return p.cancion ? `Talento: ${p.cancion}` : "Inscripción de talento";
  return `${p.cancion ?? ""}${p.dedicada_a ? ` — para ${p.dedicada_a}` : ""}`;
}

async function dibujarPedidos() {
  contenido.innerHTML = `<p class="cargando-texto">Cargando…</p>`;
  await cargar("pedidos"); // siempre fresco
  const lista = datos.pedidos.filter((p) => p.tipo === pestanaPedidos);
  const cuenta = (t: string) => datos.pedidos.filter((p) => p.tipo === t && !p.atendido).length;
  const pest = (t: "cancion" | "talento", texto: string) =>
    `<button role="tab" aria-selected="${pestanaPedidos === t}" data-accion="pestana" data-pestana="${t}">${texto}${cuenta(t) ? ` (${cuenta(t)})` : ""}</button>`;
  contenido.innerHTML = `
    <div class="encabezado"><div><h1 class="titulo-fuente">Pedidos</h1><p>Lo que envían los oyentes desde la página. También les llega por WhatsApp.</p></div>
      <button class="boton-suave" data-accion="recargar">Actualizar</button></div>
    <div class="pestanas" role="tablist">${pest("cancion", "Canciones y dedicatorias")}${pest("talento", "Inscripciones de talentos")}</div>
    <div class="filas" style="gap:14px">${
      lista.length
        ? lista
            .map(
              (p) => `
      <article class="tarjeta pedido${p.atendido ? " atendido" : ""}">
        <div class="arriba"><div class="avatar">${esc(iniciales(p.nombre))}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="nombre">${esc(p.nombre)}</span><span class="meta">${p.desde ? `desde ${esc(p.desde)} · ` : ""}${esc(
              haceCuanto(p.creado),
            )}</span>${p.atendido ? `<span class="chip chip-gris">Atendido</span>` : ""}</div>
            ${p.cancion ? `<div class="principal"><b>${p.tipo === "talento" ? "Talento:" : "Canción:"}</b> ${esc(p.cancion)}</div>` : ""}
            ${p.dedicada_a ? `<div class="mensaje"><b>Para:</b> ${esc(p.dedicada_a)}</div>` : ""}
            ${p.mensaje ? `<div class="mensaje">${esc(p.mensaje)}</div>` : ""}
          </div></div>
        <div class="botones">
          <button class="${p.atendido ? "boton-suave" : "boton"}" data-accion="atendido" data-id="${esc(p.id)}">${p.atendido ? "Marcar como nuevo" : `${svg(IC.check, 18)}Marcar atendido`}</button>
          <button class="boton-peligro" data-accion="borrar-pedido" data-id="${esc(p.id)}">Borrar</button>
        </div>
      </article>`,
            )
            .join("")
        : `<div class="tarjeta vacio">${svg(IC.pedidos, 40)}<div class="t">No hay pedidos aquí</div><p>Cuando un oyente envíe uno desde la página, aparecerá en esta lista.</p></div>`
    }</div>`;
}

/* ---------- Comentarios de los oyentes ---------- */
const ESTRELLA_LLENA = (n: number) =>
  `<span style="color:var(--acc);letter-spacing:2px" aria-label="${n} de 5 estrellas">${"★".repeat(n)}<span style="opacity:.3">${"★".repeat(5 - n)}</span></span>`;

async function dibujarComentarios() {
  contenido.innerHTML = `<p class="cargando-texto">Cargando…</p>`;
  await cargar("comentarios"); // siempre fresco
  const todos = datos.comentarios;
  const grupos = {
    revisar: todos.filter((c) => !c.revisado),
    publicados: todos.filter((c) => c.aprobado),
    ocultos: todos.filter((c) => c.revisado && !c.aprobado),
  };
  const lista = [...grupos[pestanaComentarios]].sort((a, b) => Number(b.destacado) - Number(a.destacado));
  const pest = (t: keyof typeof grupos, texto: string) =>
    `<button role="tab" aria-selected="${pestanaComentarios === t}" data-accion="pestana-com" data-pestana="${t}">${texto} (${grupos[t].length})</button>`;
  const vacio = {
    revisar: "No hay comentarios nuevos. Cuando un oyente deje uno en la página, aparecerá aquí para que lo revises.",
    publicados: "Todavía no has aprobado ningún comentario.",
    ocultos: "No hay comentarios ocultos.",
  }[pestanaComentarios];

  contenido.innerHTML = `
    <div class="encabezado"><div><h1 class="titulo-fuente">Comentarios</h1><p>Lo que escriben los oyentes. Solo salen en la página los que apruebes.</p></div>
      <button class="boton-suave" data-accion="recargar">Actualizar</button></div>
    <div class="pestanas" role="tablist">${pest("revisar", "Por revisar")}${pest("publicados", "Publicados")}${pest("ocultos", "Ocultos")}</div>
    <div class="filas" style="gap:14px">${
      lista.length
        ? lista
            .map(
              (c) => `
      <article class="tarjeta pedido">
        <div class="arriba"><div class="avatar">${esc(iniciales(c.nombre))}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="nombre">${esc(c.nombre)}</span><span class="meta">${c.pais ? `${esc(c.pais)} · ` : ""}${esc(
              haceCuanto(c.creado),
            )}</span>${c.destacado ? `<span class="chip chip-oro">Destacado</span>` : ""}</div>
            ${c.estrellas ? `<div style="margin-top:4px">${ESTRELLA_LLENA(c.estrellas)}</div>` : ""}
            <div class="principal">«${esc(c.texto)}»</div>
          </div></div>
        <div class="botones">
          ${c.aprobado ? "" : `<button class="boton" data-accion="com-aprobar" data-id="${esc(c.id)}">${svg(IC.check, 18)}Aprobar</button>`}
          ${c.aprobado ? `<button class="boton-linea" data-accion="com-destacar" data-id="${esc(c.id)}">${c.destacado ? "Quitar destacado" : "★ Destacar"}</button>` : ""}
          ${c.aprobado || !c.revisado ? `<button class="boton-suave" data-accion="com-ocultar" data-id="${esc(c.id)}">Ocultar</button>` : ""}
          <button class="boton-peligro" data-accion="com-borrar" data-id="${esc(c.id)}">Borrar</button>
        </div>
      </article>`,
            )
            .join("")
        : `<div class="tarjeta vacio">${svg(IC.pedidos, 40)}<div class="t">Nada por aquí</div><p>${esc(vacio)}</p></div>`
    }</div>`;
}

async function cambiarComentario(id: string, cambios: Fila, aviso: string) {
  const { error } = await supabase.from("comentarios").update(cambios).eq("id", id);
  if (error) return avisar(ERROR_RED, "mal");
  avisar(aviso);
  return dibujarComentarios();
}

/* ---------- Listas ---------- */
function dibujarLista(col: Coleccion) {
  const filas = [...datos[col.tabla]];
  if (col.orden) filas.sort(col.orden);
  contenido.innerHTML = `
    <div class="encabezado"><div><h1 class="titulo-fuente">${esc(col.titulo)}</h1><p>${esc(col.descripcion)}</p></div>
      <button class="boton" data-accion="ir" data-ruta="${col.tabla}/nuevo">${svg(IC.mas, 20)}Agregar ${esc(col.singular)}</button></div>
    ${
      filas.length
        ? `<div class="${col.disposicion === "cuadricula" ? "cuadricula" : "filas"}" style="${col.disposicion === "renglones" ? "gap:12px" : ""}">${filas.map(col.tarjeta).join("")}</div>`
        : `<div class="tarjeta vacio">${svg(IC.anuncio, 40)}<div class="t">Nada por aquí todavía</div><p>${esc(col.vacio)}</p></div>`
    }`;
}

/* ---------- Formulario de agregar / editar ---------- */
function dibujarFormulario(col: Coleccion, fila: Fila | null) {
  const titulo = fila ? `Editar ${col.singular}` : `Agregar ${col.singular}`;
  contenido.innerHTML = `
    <div><button class="enlace-boton" data-accion="ir" data-ruta="${col.tabla}" style="display:inline-flex;align-items:center;gap:4px">${svg(IC.volver, 20)}Volver a ${esc(
      col.titulo.toLowerCase(),
    )}</button>
    <h1 class="titulo-fuente" style="margin:6px 0 0;font-size:clamp(24px,4vw,30px)">${esc(titulo)}</h1></div>
    <form class="tarjeta formulario" id="formulario" novalidate data-tabla="${col.tabla}" data-id="${esc(fila?.id ?? "")}">
      ${col.campos.map((c) => campoHTML(c, fila)).join("")}
      <p class="aviso-error" id="error-form" role="alert" hidden></p>
      <div class="pie-form">
        <button type="submit" class="boton boton-grande">Guardar</button>
        ${fila ? `<button type="button" class="boton-peligro" data-accion="borrar" data-id="${esc(fila.id)}">Borrar</button>` : ""}
      </div>
    </form>`;
}

async function guardarColeccion(form: HTMLFormElement) {
  const col = colecciones[form.dataset.tabla!];
  const id = form.dataset.id || null;
  const fila = id ? datos[col.tabla].find((f) => f.id === id) ?? null : null;
  const { valores, errores } = leerFormulario(form, col.campos);
  mostrarErrores(form, errores);
  if (errores.length) return;

  const boton = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const errorForm = $("#error-form");
  errorForm.hidden = true;
  boton.disabled = true;
  boton.textContent = "Guardando…";
  const subidas: string[] = [];
  const viejas: (string | null)[] = [];
  try {
    for (const c of col.campos.filter((c) => c.tipo === "foto")) {
      const elegida = fotosElegidas[c.k];
      if (elegida?.archivo) {
        boton.textContent = "Subiendo foto…";
        const url = await subirFoto(elegida.archivo, col.carpeta);
        subidas.push(url);
        valores[c.k] = url;
        if (fila?.[c.k]) viejas.push(fila[c.k]);
      } else if (elegida?.quitar) {
        valores[c.k] = null;
        if (fila?.[c.k]) viejas.push(fila[c.k]);
      }
    }
    boton.textContent = "Guardando…";
    // Solo un "Talento de la semana": se le quita al anterior.
    if (col.tabla === "cantantes" && valores.destacado) {
      let q = supabase.from("cantantes").update({ destacado: false }).eq("destacado", true);
      if (id) q = q.neq("id", id);
      const { error } = await q;
      if (error) throw error;
    }
    const { error } = id ? await supabase.from(col.tabla).update(valores).eq("id", id) : await supabase.from(col.tabla).insert(valores);
    if (error) throw error;
    await borrarFotos(viejas).catch(() => {});
    await cargar(col.tabla);
    avisar("Guardado");
    ir(col.tabla);
  } catch (e) {
    await borrarFotos(subidas).catch(() => {});
    errorForm.textContent = ERROR_RED;
    errorForm.hidden = false;
    boton.disabled = false;
    boton.textContent = "Guardar";
    console.error(e);
  }
}

/* ---------- Datos de la emisora ---------- */
async function dibujarDatos() {
  contenido.innerHTML = `<p class="cargando-texto">Cargando…</p>`;
  await cargarAjustes();
  contenido.innerHTML = `
    <div class="encabezado"><div><h1 class="titulo-fuente">Datos de la emisora</h1><p>El teléfono, el correo y las redes de la emisora.</p></div></div>
    <form class="tarjeta formulario" id="form-datos" novalidate>
      ${camposAjustes.map((c) => campoHTML(c, ajustes ?? {})).join("")}
      <p class="aviso-error" id="error-form" role="alert" hidden></p>
      <button type="submit" class="boton boton-grande">Guardar cambios</button>
    </form>`;
}
async function guardarDatos(form: HTMLFormElement) {
  const { valores, errores } = leerFormulario(form, camposAjustes);
  mostrarErrores(form, errores);
  if (errores.length) return;
  const boton = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  boton.disabled = true;
  boton.textContent = "Guardando…";
  const { error } = await supabase.from("ajustes").upsert({ id: 1, ...valores, actualizado: new Date().toISOString() });
  boton.disabled = false;
  boton.textContent = "Guardar cambios";
  if (error) {
    $("#error-form").textContent = ERROR_RED;
    $("#error-form").hidden = false;
    return;
  }
  avisar("Guardado");
}

/* =====================================================================
   Clics y formularios (un solo escuchador para todo el contenido)
   ===================================================================== */
contenido.addEventListener("click", async (e) => {
  const el = e.target as HTMLElement;

  const dia = el.closest<HTMLElement>("[data-dia]");
  if (dia) return dia.setAttribute("aria-pressed", String(dia.getAttribute("aria-pressed") !== "true"));
  const sw = el.closest<HTMLElement>("[data-switch]");
  if (sw) return sw.setAttribute("aria-checked", String(sw.getAttribute("aria-checked") !== "true"));
  const quitar = el.closest<HTMLElement>("[data-quitar-foto]");
  if (quitar) {
    const k = quitar.dataset.quitarFoto!;
    fotosElegidas[k] = { quitar: true };
    contenido.querySelector<HTMLElement>(`[data-vista="${k}"]`)!.hidden = true;
    contenido.querySelector<HTMLInputElement>(`[data-archivo="${k}"]`)!.value = "";
    return;
  }

  const boton = el.closest<HTMLElement>("[data-accion]");
  if (!boton) return;
  const accion = boton.dataset.accion;
  const id = boton.dataset.id!;
  const [sec] = location.hash.slice(1).split("/");

  if (accion === "ir") return ir(boton.dataset.ruta!);
  if (accion === "radio") return alternarRadio();
  if (accion === "editar") return ir(`${sec}/${id}`);
  if (accion === "reintentar" || accion === "recargar") return dibujar();
  if (accion === "pestana") {
    pestanaPedidos = boton.dataset.pestana as "cancion" | "talento";
    return dibujarPedidos();
  }

  if (accion === "atendido") {
    const p = datos.pedidos.find((x) => x.id === id);
    if (!p) return;
    (boton as HTMLButtonElement).disabled = true;
    const { error } = await supabase.from("pedidos").update({ atendido: !p.atendido }).eq("id", id);
    if (error) {
      (boton as HTMLButtonElement).disabled = false;
      return avisar(ERROR_RED, "mal");
    }
    return dibujarPedidos();
  }

  if (accion === "pestana-com") {
    pestanaComentarios = boton.dataset.pestana as typeof pestanaComentarios;
    return dibujarComentarios();
  }
  if (accion === "com-aprobar") return cambiarComentario(id, { aprobado: true, revisado: true }, "Aprobado: ya sale en la página");
  if (accion === "com-ocultar") return cambiarComentario(id, { aprobado: false, destacado: false, revisado: true }, "Ocultado");
  if (accion === "com-destacar") {
    const c = datos.comentarios.find((x) => x.id === id);
    if (c) return cambiarComentario(id, { destacado: !c.destacado }, c.destacado ? "Ya no está destacado" : "Destacado: sale primero");
  }
  if (accion === "com-borrar") {
    const c = datos.comentarios.find((x) => x.id === id);
    if (!c || !(await confirmar("¿Seguro que quieres borrar este comentario?", `El comentario de ${c.nombre} se borrará para siempre.`))) return;
    const { data: borrados, error } = await supabase.from("comentarios").delete().eq("id", id).select("id");
    if (error || !borrados?.length) return avisar(NO_BORRO, "mal");
    avisar("Comentario borrado");
    return dibujarComentarios();
  }

  if (accion === "borrar-pedido") {
    const p = datos.pedidos.find((x) => x.id === id);
    if (!p || !(await confirmar("¿Seguro que quieres borrar este pedido?", `El pedido de ${p.nombre} se borrará para siempre.`))) return;
    const { data: borrados, error } = await supabase.from("pedidos").delete().eq("id", id).select("id");
    if (error || !borrados?.length) return avisar(NO_BORRO, "mal");
    avisar("Pedido borrado");
    return dibujarPedidos();
  }

  if (accion === "borrar") {
    const col = colecciones[sec];
    const fila = datos[col.tabla].find((f) => f.id === id);
    if (!fila || !(await confirmar(`¿Seguro que quieres borrar «${col.nombre(fila)}»?`, "Se borrará de la página para siempre. Si solo quieres esconderlo, apaga «Mostrar en la página»."))) return;
    const { data: borrados, error } = await supabase.from(col.tabla).delete().eq("id", id).select("id");
    if (error || !borrados?.length) return avisar(NO_BORRO, "mal");
    await borrarFotos(col.campos.filter((c) => c.tipo === "foto").map((c) => fila[c.k])).catch(() => {});
    await cargar(col.tabla);
    avisar("Borrado");
    return ir(col.tabla);
  }
});

contenido.addEventListener("change", (e) => {
  const input = e.target as HTMLInputElement;
  const k = input.dataset.archivo;
  if (!k || !input.files?.[0]) return;
  const archivo = input.files[0];
  if (!archivo.type.startsWith("image/")) return avisar("Ese archivo no es una foto.", "mal");
  if (fotosElegidas[k]?.vista) URL.revokeObjectURL(fotosElegidas[k].vista!);
  const vista = URL.createObjectURL(archivo);
  fotosElegidas[k] = { archivo, vista };
  const caja = contenido.querySelector<HTMLElement>(`[data-vista="${k}"]`)!;
  caja.querySelector("img")!.src = vista;
  caja.hidden = false;
});

contenido.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  if (form.id === "formulario") guardarColeccion(form);
  else if (form.id === "form-datos") guardarDatos(form);
});

/* ---------- Menú ---------- */
const menu = $("#menu");
const velo = $("#velo");
const abrirMenu = $("#abrir-menu");
function cerrarMenu() {
  menu.classList.remove("abierto");
  velo.hidden = true;
  abrirMenu.setAttribute("aria-expanded", "false");
}
abrirMenu.addEventListener("click", () => {
  menu.classList.add("abierto");
  velo.hidden = false;
  abrirMenu.setAttribute("aria-expanded", "true");
  menu.querySelector<HTMLElement>("[data-ir]")?.focus();
});
velo.addEventListener("click", cerrarMenu);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu.classList.contains("abierto")) {
    cerrarMenu();
    abrirMenu.focus();
  }
});
document.querySelectorAll<HTMLElement>("[data-ir]").forEach((b) => b.addEventListener("click", () => ir(b.dataset.ir!)));
/* ---------- Instalar el panel como aplicación (Android, iPhone, Windows, Mac) ---------- */
const dialogoInstalar = $<HTMLDialogElement>("#dialogo-instalar");
function explicarInstalar(texto: string) {
  $("#instalar-texto").textContent = texto;
  dialogoInstalar.showModal();
}
dialogoInstalar.querySelector("[data-cerrar-instalar]")!.addEventListener("click", () => dialogoInstalar.close());
document.querySelectorAll<HTMLElement>("[data-instalar]").forEach((b) =>
  b.addEventListener("click", async () => {
    cerrarMenu();
    const r = await instalar();
    if (r === "ya") explicarInstalar("El panel ya está instalado en este aparato. Lo encuentras en tu pantalla de inicio o en el escritorio como «Panel Alegría».");
    else if (r === "pasos") explicarInstalar(pasosInstalar());
  }),
);
window.addEventListener("appinstalled", () => avisar("Panel instalado: búscalo como «Panel Alegría»"));
// Si ya se abrió como aplicación, el botón del menú sobra.
if (yaInstalada()) document.querySelectorAll<HTMLElement>("[data-instalar-menu]").forEach((el) => (el.hidden = true));

$("#campana").addEventListener("click",() => ir(pendientes.pedidos || !pendientes.comentarios ? "pedidos" : "comentarios"));
window.addEventListener("hashchange", dibujar);

/* =====================================================================
   Entrar y salir
   ===================================================================== */
const vistas = ["vista-cargando", "vista-entrar", "vista-clave", "vista-panel"];
function verVista(id: string) {
  vistas.forEach((v) => ($(`#${v}`).hidden = v !== id));
}

let panelListo = false;
let intervaloPedidos: number | undefined;
async function abrirPanel(uid: string) {
  const { data, error } = await supabase.from("administradores").select("user_id").eq("user_id", uid).maybeSingle();
  if (error || !data) {
    await supabase.auth.signOut();
    mostrarErrorEntrar(error ? "No se pudo comprobar tu cuenta. Revisa tu internet." : "Esta cuenta no tiene permiso para entrar al panel.");
    return;
  }
  verVista("vista-panel");
  if (!panelListo) {
    panelListo = true;
    cargado = {};
    dibujar();
    contarPendientes();
    intervaloPedidos = window.setInterval(contarPendientes, 60_000);
  }
}

function mostrarErrorEntrar(texto: string) {
  verVista("vista-entrar");
  const e = $("#error-entrar");
  e.textContent = texto;
  e.hidden = false;
}

$("#form-entrar").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const correo = (form.correo as HTMLInputElement).value.trim();
  const clave = (form.clave as HTMLInputElement).value;
  $("#aviso-entrar").hidden = true;
  if (!correo || !clave) return mostrarErrorEntrar("Escribe tu correo y tu contraseña.");
  const boton = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  boton.disabled = true;
  boton.textContent = "Entrando…";
  const { error } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
  boton.disabled = false;
  boton.textContent = "Entrar";
  if (error) {
    mostrarErrorEntrar(
      error.message.includes("Invalid login") ? "El correo o la contraseña no son correctos." : "No se pudo entrar. Revisa tu internet e intenta de nuevo.",
    );
    return;
  }
  $("#error-entrar").hidden = true;
  (form.clave as HTMLInputElement).value = "";
});

$("#olvide").addEventListener("click", async () => {
  const correo = ($("#correo") as HTMLInputElement).value.trim();
  $("#error-entrar").hidden = true;
  if (!correo) {
    mostrarErrorEntrar("Escribe tu correo arriba y vuelve a tocar «¿Olvidaste tu contraseña?».");
    ($("#correo") as HTMLInputElement).focus();
    return;
  }
  const { error } = await supabase.auth.resetPasswordForEmail(correo, { redirectTo: `${location.origin}/admin` });
  if (error) return mostrarErrorEntrar("No se pudo enviar el correo. Intenta de nuevo en unos minutos.");
  const aviso = $("#aviso-entrar");
  aviso.textContent = "Te enviamos un correo con un enlace para crear una contraseña nueva. Revisa también «Spam».";
  aviso.hidden = false;
});

$("#form-clave").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nueva = ($("#clave-nueva") as HTMLInputElement).value;
  const repite = ($("#clave-repite") as HTMLInputElement).value;
  const err = $("#error-clave");
  err.hidden = true;
  if (nueva.length < 8) {
    err.textContent = "La contraseña debe tener al menos 8 letras o números.";
    err.hidden = false;
    return;
  }
  if (nueva !== repite) {
    err.textContent = "Las dos contraseñas no son iguales.";
    err.hidden = false;
    return;
  }
  const { data, error } = await supabase.auth.updateUser({ password: nueva });
  if (error || !data.user) {
    err.textContent = "No se pudo cambiar la contraseña. Pide otro correo de recuperación.";
    err.hidden = false;
    return;
  }
  avisar("Contraseña cambiada");
  recuperando = false;
  history.replaceState(null, "", "/admin");
  abrirPanel(data.user.id);
});

async function salir() {
  await supabase.auth.signOut();
}
$("#salir").addEventListener("click", salir);
$("#salir-movil").addEventListener("click", salir);

let recuperando = false;
supabase.auth.onAuthStateChange((evento, sesion) => {
  // Lo de Supabase se hace fuera de este aviso para no trabar la sesión.
  setTimeout(() => {
    if (evento === "PASSWORD_RECOVERY") {
      recuperando = true;
      verVista("vista-clave");
      return;
    }
    if (recuperando) return;
    if (sesion?.user) abrirPanel(sesion.user.id);
    else {
      panelListo = false;
      clearInterval(intervaloPedidos);
      fuenteSonando?.close();
      if (estadoRadio !== "parado") alternarRadio(); // al salir, se apaga la radio
      fuenteSonando = null;
      contenido.innerHTML = "";
      verVista("vista-entrar");
    }
  }, 0);
});
