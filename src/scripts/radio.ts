import { emisora, programas, DIFERENCIA_RD, nombresDias, enlaceWhatsApp } from "../data/emisora";
import { guardarPedido } from "../lib/config";
import { traerProgramas, ponerTarjetas, type ProgramaVivo } from "./programas-vivo";

const raiz = document.documentElement;
const audio = document.getElementById("audio") as HTMLAudioElement;
const botonesPlay = document.querySelectorAll<HTMLButtonElement>("[data-play]");

/* ---------------- Avisos cortos ---------------- */
const aviso = document.getElementById("aviso")!;
let temporizadorAviso: number | undefined;
function avisar(texto: string) {
  aviso.textContent = texto;
  aviso.classList.remove("hidden");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = window.setTimeout(() => aviso.classList.add("hidden"), 3500);
}

/* ---------------- Reproductor ---------------- */
type Estado = "parado" | "cargando" | "sonando";

function ponerEstado(estado: Estado) {
  raiz.dataset.radio = estado;
  const activo = estado !== "parado";
  botonesPlay.forEach((b) => {
    b.setAttribute("aria-pressed", String(activo));
    if (b.hasAttribute("aria-label")) b.setAttribute("aria-label", activo ? "Pausar la radio" : "Escuchar en vivo");
  });
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = activo ? "playing" : "paused";
  if (activo) mostrarMini(true);
}

async function reproducir() {
  ponerEstado("cargando");
  // Es una señal en vivo: cada vez que se da play se conecta de nuevo para oír lo que suena ahora.
  audio.src = emisora.stream;
  try {
    await audio.play();
  } catch (error) {
    if ((error as DOMException)?.name === "AbortError") return; // se pausó mientras cargaba
    ponerEstado("parado");
    avisar("No pudimos conectar con la radio. Intenta de nuevo en un momento.");
  }
}

function pausar() {
  audio.pause();
  audio.removeAttribute("src");
  audio.load(); // corta la descarga de la señal
  ponerEstado("parado");
}

function alternar() {
  if (raiz.dataset.radio === "parado") reproducir();
  else pausar();
}

botonesPlay.forEach((b) => b.addEventListener("click", alternar));
audio.addEventListener("playing", () => ponerEstado("sonando"));
audio.addEventListener("waiting", () => {
  if (audio.getAttribute("src")) ponerEstado("cargando");
});
audio.addEventListener("error", () => {
  if (!audio.getAttribute("src")) return; // error por haber quitado la señal al pausar
  ponerEstado("parado");
  avisar("Se perdió la conexión con la radio. Dale play otra vez.");
});

// Volumen (se recuerda en este navegador).
const volumen = document.getElementById("volumen") as HTMLInputElement | null;
try {
  const guardado = localStorage.getItem("volumen");
  if (guardado !== null && volumen) {
    volumen.value = guardado;
    audio.volume = Number(guardado);
  }
} catch {}
volumen?.addEventListener("input", () => {
  audio.volume = Number(volumen.value);
  try {
    localStorage.setItem("volumen", volumen.value);
  } catch {}
});

// Controles en la pantalla de bloqueo del celular.
const logoIcono = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')?.href;
function actualizarPantallaBloqueo(titulo: string, artista: string) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: titulo,
    artist: artista,
    album: `${emisora.nombre} · En vivo`,
    artwork: logoIcono ? [{ src: logoIcono, sizes: "180x180", type: "image/png" }] : [],
  });
}
if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", reproducir);
  navigator.mediaSession.setActionHandler("pause", pausar);
  navigator.mediaSession.setActionHandler("stop", pausar);
  actualizarPantallaBloqueo(emisora.nombre, emisora.lema);
}

/* ---------------- Barra de abajo ---------------- */
function mostrarMini(si: boolean) {
  if (si || raiz.dataset.radio !== "parado") raiz.dataset.mini = "si";
  else delete raiz.dataset.mini;
}
const inicio = document.getElementById("inicio")!;
new IntersectionObserver(([e]) => mostrarMini(!e.isIntersecting), { threshold: 0.15 }).observe(inicio);

/* ---------------- Sonando ahora (Zeno) ---------------- */
function mostrarCancion(texto: string) {
  const limpio = texto.trim();
  if (!limpio) return;
  const partes = limpio.split(" - ");
  const [artista, cancion] = partes.length > 1 ? [partes[0], partes.slice(1).join(" - ")] : [emisora.nombre, limpio];
  document.querySelectorAll("[data-cancion]").forEach((el) => (el.textContent = cancion));
  document.querySelectorAll("[data-artista]").forEach((el) => (el.textContent = artista));
  actualizarPantallaBloqueo(cancion, artista);
}

if ("EventSource" in window) {
  const fuente = new EventSource(emisora.sonandoAhora);
  fuente.addEventListener("message", (e) => {
    try {
      const datos = JSON.parse(e.data);
      if (datos.streamTitle) mostrarCancion(String(datos.streamTitle));
    } catch {}
  });
}

/* ---------------- Al aire ahora / próximo programa ---------------- */
const HORA = 3600_000;
const visitanteEnRD = new Date().getTimezoneOffset() === -DIFERENCIA_RD * 60;

type Turno = { indice: number; inicio: number; fin: number };
let listaProgramas: ProgramaVivo[] = programas;
const conApodo = (p: ProgramaVivo) => (p.apodo ? `${p.locutor}, «${p.apodo}»` : p.locutor);

function turnos(ahora: number): Turno[] {
  const rd = new Date(ahora + DIFERENCIA_RD * HORA); // sus campos UTC = reloj de RD
  const lista: Turno[] = [];
  listaProgramas.forEach((p, indice) => {
    for (let d = -1; d <= 7; d++) {
      const relojRD = Date.UTC(rd.getUTCFullYear(), rd.getUTCMonth(), rd.getUTCDate() + d, p.hora, p.minuto);
      if (!p.dias.includes(new Date(relojRD).getUTCDay())) continue;
      const inicio = relojRD - DIFERENCIA_RD * HORA;
      lista.push({ indice, inicio, fin: inicio + p.duracionMin * 60_000 });
    }
  });
  return lista.sort((a, b) => a.inicio - b.inicio);
}

function cuentaRegresiva(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  if (d > 0) return `${d} d ${h} h ${m} min`;
  if (h > 0) return `${h} h ${String(m).padStart(2, "0")} min`;
  return `${m}:${String(seg).padStart(2, "0")}`;
}

const formatoHoraLocal = new Intl.DateTimeFormat("es", { weekday: "long", hour: "numeric", minute: "2-digit", hour12: true });

const caja = document.getElementById("al-aire")!;
const q = (sel: string) => caja.querySelector(sel)!;

function actualizarAlAire() {
  const ahora = Date.now();
  const lista = turnos(ahora);
  const actual = lista.find((t) => ahora >= t.inicio && ahora < t.fin);
  const proximo = lista.find((t) => t.inicio > ahora);

  if (actual) {
    const p = listaProgramas[actual.indice];
    q("[data-aire-etiqueta]").textContent = "🔴 AL AIRE AHORA";
    q("[data-aire-nombre]").textContent = p.nombre;
    q("[data-aire-detalle]").textContent = `Con ${conApodo(p)}. ¡Dale play!`;
    q("[data-aire-cuenta-etiqueta]").textContent = "TERMINA EN";
    q("[data-aire-cuenta]").textContent = cuentaRegresiva(actual.fin - ahora);
  } else if (proximo) {
    const p = listaProgramas[proximo.indice];
    const rd = new Date(proximo.inicio + DIFERENCIA_RD * HORA);
    q("[data-aire-etiqueta]").textContent = "PRÓXIMO PROGRAMA";
    q("[data-aire-nombre]").textContent = p.nombre;
    q("[data-aire-detalle]").textContent = `${nombresDias[rd.getUTCDay()]} con ${conApodo(p)}`;
    q("[data-aire-cuenta-etiqueta]").textContent = "EMPIEZA EN";
    q("[data-aire-cuenta]").textContent = cuentaRegresiva(proximo.inicio - ahora);
  }

  // Marcar en las tarjetas el programa que está al aire.
  document.querySelectorAll<HTMLElement>("[data-programa]").forEach((tarjeta) => {
    const marca = tarjeta.querySelector<HTMLElement>("[data-al-aire]");
    if (marca) marca.hidden = actual?.indice !== Number(tarjeta.dataset.programa);
  });
}

// En cada tarjeta: la hora del programa en la zona del visitante (si no está en RD).
function ponerTuHora() {
  if (visitanteEnRD) return;
  const lista = turnos(Date.now());
  document.querySelectorAll<HTMLElement>("[data-programa]").forEach((tarjeta) => {
    const turno = lista.find((t) => t.indice === Number(tarjeta.dataset.programa) && t.fin > Date.now());
    const destino = tarjeta.querySelector<HTMLElement>("[data-tu-hora]");
    if (!turno || !destino) return;
    destino.querySelector("span")!.textContent = `En tu hora: ${formatoHoraLocal.format(turno.inicio)}`;
    destino.hidden = false;
  });
}
ponerTuHora();

// Los programas que el dueño maneja desde el panel (Supabase) reemplazan a los escritos en la página.
traerProgramas().then((desdeLaBase) => {
  if (!desdeLaBase) return; // sin conexión: se queda lo que ya se ve
  const nombresDeAntes = listaProgramas.map((p) => p.nombre);
  listaProgramas = desdeLaBase;
  ponerTarjetas(listaProgramas, nombresDeAntes);
  ponerTuHora();
  actualizarAlAire();
});

actualizarAlAire();
setInterval(actualizarAlAire, 1000);

/* ---------------- Pide tu canción ---------------- */
const form = document.getElementById("form-pedido") as HTMLFormElement;
const errorPedido = document.getElementById("error-pedido")!;
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const datos = new FormData(form);
  const valor = (n: string) => String(datos.get(n) ?? "").trim();
  const faltan = [...form.querySelectorAll<HTMLInputElement>("[required]")].filter((c) => !c.value.trim());
  if (faltan.length) {
    errorPedido.textContent = "Escribe la canción y tu nombre para enviar el pedido.";
    errorPedido.classList.remove("hidden");
    faltan[0].focus();
    return;
  }
  errorPedido.classList.add("hidden");

  const lineas = [`¡Hola, ${emisora.nombre}! 🎶`, "", `🎵 Quiero pedir: ${valor("cancion")}`];
  if (valor("para")) lineas.push(`💛 Dedicada a: ${valor("para")}`);
  if (valor("saludo")) lineas.push(`💬 Saludo: ${valor("saludo")}`);
  lineas.push(`🙋 De parte de: ${valor("nombre")}`);
  if (valor("desde")) lineas.push(`📍 Desde: ${valor("desde")}`);

  // También queda guardado en la lista de pedidos del panel. Si falla, el pedido igual sale por WhatsApp.
  guardarPedido({
    tipo: "cancion",
    nombre: valor("nombre").slice(0, 60),
    cancion: valor("cancion").slice(0, 120),
    dedicada_a: valor("para").slice(0, 80) || null,
    mensaje: valor("saludo").slice(0, 300) || null,
    desde: valor("desde").slice(0, 60) || null,
  }).catch(() => {});

  window.open(enlaceWhatsApp(lineas.join("\n")), "_blank", "noopener");
});

/* ---------------- Compartir la emisora ---------------- */
const textoCompartir = `🎶 Escucha ${emisora.nombre}, ${emisora.lema.toLowerCase()}. Romántica, tropical, baladas y más, en vivo:`;
document.querySelectorAll("[data-compartir]").forEach((b) =>
  b.addEventListener("click", async () => {
    const url = location.origin + location.pathname;
    if (navigator.share) {
      try {
        await navigator.share({ title: emisora.nombre, text: textoCompartir, url });
      } catch {}
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${textoCompartir} ${url}`)}`, "_blank", "noopener");
  }),
);

/* ---------------- Llévanos en tu celular ---------------- */
// En Android/Chrome el navegador ofrece instalarla directo; en iPhone hay que hacerlo desde Compartir.
type AvisoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };
let ofertaInstalar: AvisoInstalar | null = null;
const botonInstalar = document.getElementById("boton-instalar");
const pasosInstalar = document.getElementById("pasos-instalar");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  ofertaInstalar = e as AvisoInstalar;
});
window.addEventListener("appinstalled", () => {
  if (!pasosInstalar) return;
  pasosInstalar.textContent = "¡Listo! Ya tienes la emisora en tu celular.";
  pasosInstalar.hidden = false;
});

botonInstalar?.addEventListener("click", async () => {
  if (ofertaInstalar) {
    await ofertaInstalar.prompt();
    await ofertaInstalar.userChoice;
    ofertaInstalar = null;
    return;
  }
  if (!pasosInstalar) return;
  const esIphone = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  pasosInstalar.textContent = esIphone
    ? "En Safari, toca el botón Compartir (el cuadrito con la flecha ↑) y luego «Agregar a inicio»."
    : "Abre el menú del navegador (los tres puntitos ⋮) y toca «Agregar a la pantalla de inicio» o «Instalar aplicación».";
  pasosInstalar.hidden = false;
});

/* ---------------- Menú del celular ---------------- */
const botonMenu = document.getElementById("boton-menu")!;
const menuMovil = document.getElementById("menu-movil")!;
function cerrarMenu() {
  menuMovil.classList.remove("abierto");
  botonMenu.setAttribute("aria-expanded", "false");
  botonMenu.setAttribute("aria-label", "Abrir menú");
}
botonMenu.addEventListener("click", () => {
  const abierto = menuMovil.classList.toggle("abierto");
  botonMenu.setAttribute("aria-expanded", String(abierto));
  botonMenu.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
});
menuMovil.querySelectorAll("a").forEach((a) => a.addEventListener("click", cerrarMenu));

/* ---------------- Sección actual en el menú ---------------- */
const enlacesNav = document.querySelectorAll<HTMLAnchorElement>(".enlace-nav");
const observadorSecciones = new IntersectionObserver(
  (entradas) =>
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      enlacesNav.forEach((a) =>
        a.getAttribute("href") === `#${e.target.id}` ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"),
      );
    }),
  { rootMargin: "-45% 0px -50% 0px" },
);
document.querySelectorAll("main section[id]").forEach((s) => observadorSecciones.observe(s));

/* ---------------- Aparecer al bajar ---------------- */
const observadorAparece = new IntersectionObserver(
  (entradas) =>
    entradas.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visto");
        observadorAparece.unobserve(e.target);
      }
    }),
  { threshold: 0.12 },
);
document.querySelectorAll(".aparece").forEach((el) => observadorAparece.observe(el));
