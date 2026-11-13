// Proyecto "alegria-stereo" en Supabase.
export const SUPABASE_URL = "https://rqrdoeknkmztsiouwxvw.supabase.co";

// Clave PÚBLICA (publishable): está hecha para verse en el navegador.
// Lo que cada quien puede ver o cambiar lo deciden las reglas de la base (supabase/01-esquema.sql).
// NUNCA poner aquí la clave secreta (service_role / secret).
export const CLAVE_PUBLICA = "sb_publishable_Mhfuw5QcCMpH1BeoWGulxQ_x51zbFRd";

// Guarda un pedido de canción en la base para que aparezca en el panel.
// Es una llamada liviana (sin la librería de Supabase) para no hacer más pesada la página pública.
export function guardarPedido(pedido: {
  tipo: "cancion" | "talento";
  nombre: string;
  cancion?: string | null;
  dedicada_a?: string | null;
  mensaje?: string | null;
  desde?: string | null;
}) {
  return fetch(`${SUPABASE_URL}/rest/v1/pedidos`, {
    method: "POST",
    keepalive: true, // que se termine de enviar aunque se abra WhatsApp
    headers: { apikey: CLAVE_PUBLICA, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(pedido),
  });
}
