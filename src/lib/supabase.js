import { createClient } from "@supabase/supabase-js";

// En Vite, las variables de entorno deben comenzar con VITE_ para ser expuestas al cliente.
// Asegúrate de que tu archivo .env tenga VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL o Anon Key no configuradas. Verifica que las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén en tu archivo .env"
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

// Log para verificar la conexión en la consola del navegador
if (supabaseUrl && supabaseAnonKey) {
  console.log("%cConexión a Supabase: CHECK ✅", "color: #00cba9; font-weight: bold; font-size: 12px;");
} else {
  console.log("%cConexión a Supabase: X ❌ (Faltan credenciales)", "color: #ff7665; font-weight: bold; font-size: 12px;");
}
