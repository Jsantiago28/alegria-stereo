// Pone en la página el teléfono, WhatsApp, correo y redes que el dueño guarda en el panel ("Datos de la emisora").
// Si Supabase no responde, se quedan los datos que ya vienen escritos en la página (emisora.ts).
import { SUPABASE_URL, CLAVE_PUBLICA } from "../lib/config";
import { emisora } from "../data/emisora";

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

// "https://www.instagram.com/usuario/" → "@usuario"
function usuarioDe(url: string) {
  try {
    const partes = new URL(url).pathname.split("/").filter(Boolean);
    const ultimo = partes[0] === "channel" || partes[0] === "c" ? partes[1] : partes[0];
    if (!ultimo) return new URL(url).hostname.replace(/^www\./, "");
    return ultimo.startsWith("@") ? ultimo : `@${ultimo}`;
  } catch {
    return url;
  }
}

const REDES = ["instagram", "tiktok", "facebook", "youtube"] as const;

export async function cargarContacto() {
  let a: Record<string, string | null> | undefined;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/ajustes?select=*&id=eq.1`, { headers: { apikey: CLAVE_PUBLICA } });
    if (!r.ok) return;
    a = (await r.json())[0];
  } catch {
    return;
  }
  if (!a) return;

  // WhatsApp: todos los botones de WhatsApp de la página y los mensajes que arma la página.
  const wa = a.whatsapp && /^[0-9]{8,15}$/.test(a.whatsapp) ? a.whatsapp : null;
  if (wa && wa !== emisora.whatsapp) {
    const viejo = emisora.whatsapp;
    document.querySelectorAll<HTMLAnchorElement>(`a[href*="wa.me/${viejo}"]`).forEach((el) => {
      el.href = el.href.replace(`wa.me/${viejo}`, `wa.me/${wa}`);
    });
    document.querySelectorAll<HTMLAnchorElement>('[data-dato="tel"]').forEach((el) => (el.href = `tel:+${wa}`));
    emisora.whatsapp = wa; // los pedidos de canción usan este número al enviarse
  }

  if (a.telefono) document.querySelectorAll('[data-dato="telefono"]').forEach((el) => (el.textContent = a!.telefono));

  if (a.correo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.correo)) {
    document.querySelectorAll<HTMLAnchorElement>('[data-dato="mailto"]').forEach((el) => (el.href = `mailto:${a!.correo}`));
    document.querySelectorAll('[data-dato="correo"]').forEach((el) => (el.textContent = a!.correo));
  }

  // Redes: si el dueño la pone, aparece; si la borra, se esconde.
  for (const red of REDES) {
    const url = enlaceSeguro(a[red]);
    document.querySelectorAll<HTMLAnchorElement>(`a[data-red="${red}"]`).forEach((el) => {
      const caja = el.closest<HTMLElement>(`[data-red-caja="${red}"]`) ?? el.closest("li") ?? el;
      if (url) {
        el.href = url;
        el.hidden = false;
        caja.hidden = false;
      } else {
        (el.closest("li") ?? el).hidden = true;
      }
    });
    if (url) document.querySelectorAll(`[data-red-usuario="${red}"]`).forEach((el) => (el.textContent = usuarioDe(url)));
  }
}
