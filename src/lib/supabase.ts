import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, CLAVE_PUBLICA } from "./config";

export const supabase = createClient(SUPABASE_URL, CLAVE_PUBLICA);

// Carpeta pública de fotos.
export const CARPETA_FOTOS = "fotos";
