// "Instalar" la página como aplicación (pantalla de inicio en Android/iPhone, app en Windows/Mac).
// - Android y Windows/Mac con Chrome o Edge: el navegador ofrece instalar directo (beforeinstallprompt).
// - iPhone/iPad y Safari: no se puede abrir el aviso desde la página, así que mostramos los pasos.
// Lo usan la página pública (radio.ts) y el panel (admin.ts).

type OfertaInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let oferta: OfertaInstalar | null = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  oferta = e as OfertaInstalar;
});

// Sin esto algunos navegadores no ofrecen instalar. No guarda nada: todo sigue yendo directo a internet.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

export function yaInstalada() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}

type Plataforma = "iphone" | "android" | "windows" | "mac" | "otro";
export function plataforma(): Plataforma {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iphone";
  if (/android/i.test(ua)) return "android";
  if (/windows/i.test(ua)) return "windows";
  if (/macintosh|mac os x/i.test(ua)) return "mac";
  return "otro";
}

// Pasos a mano para cada aparato (cuando el navegador no deja instalar directo).
export function pasosInstalar(): string {
  const esSafari = /safari/i.test(navigator.userAgent) && !/chrome|crios|edg|fxios|android/i.test(navigator.userAgent);
  switch (plataforma()) {
    case "iphone":
      return "En el iPhone: toca el botón Compartir (el cuadrito con la flecha ↑), baja y toca «Agregar a inicio», y luego «Agregar».";
    case "android":
      return "En Android: abre el menú del navegador (los tres puntitos ⋮) y toca «Agregar a la pantalla de inicio» o «Instalar aplicación».";
    case "windows":
      return "En Windows: en Edge abre el menú ⋯ → «Aplicaciones» → «Instalar este sitio como aplicación». En Chrome toca el ícono de instalar en la barra de arriba, o el menú ⋮ → «Transmitir, guardar y compartir» → «Instalar página como aplicación».";
    case "mac":
      return esSafari
        ? "En la Mac con Safari: menú Archivo → «Añadir al Dock»."
        : "En la Mac: en Chrome toca el ícono de instalar en la barra de arriba, o el menú ⋮ → «Transmitir, guardar y compartir» → «Instalar página como aplicación».";
    default:
      return "Abre el menú de tu navegador y busca «Instalar» o «Agregar a la pantalla de inicio».";
  }
}

// Intenta instalar directo; si el navegador no lo permite, devuelve "pasos" para mostrarlos.
export async function instalar(): Promise<"instalada" | "cancelada" | "pasos" | "ya"> {
  if (yaInstalada()) return "ya";
  if (oferta) {
    const o = oferta;
    oferta = null; // el aviso solo se puede usar una vez
    await o.prompt();
    const { outcome } = await o.userChoice;
    return outcome === "accepted" ? "instalada" : "cancelada";
  }
  return "pasos";
}
