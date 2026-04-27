/**
 * @file supabase.js
 * @description Clientes Supabase singleton para el backend de Kamello.
 *
 * Exporta DOS clientes con propósitos distintos:
 *
 *  - `supabaseAnon`:  Usa la ANON KEY. Respeta RLS. Para operaciones
 *    que actúan en nombre de un usuario autenticado (pasando su JWT).
 *
 *  - `supabaseAdmin`: Usa la SERVICE ROLE KEY. Bypasea RLS. Para
 *    operaciones administrativas que el servidor necesita hacer sin
 *    restricciones de seguridad de fila (ej: triggers, jobs, etc.).
 *
 * ⚠️  NUNCA expongas supabaseAdmin al cliente (browser/app).
 *     NUNCA commitees las keys reales al repositorio.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL          = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY     = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ── Validación de entorno al arrancar ───────────────────────────────────────
// Falla rápido: si faltan las variables críticas, el servidor no levanta.
// Es mejor un crash explícito que un error silencioso en producción.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  throw new Error(
    '[Kamello] Faltan variables de entorno de Supabase. ' +
    'Revisa SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY en tu .env'
  );
}

// ── Cliente ANON (respeta RLS) ───────────────────────────────────────────────
// Se usa para operaciones autenticadas: verificar OTPs, leer datos de usuario.
// Para actuar en nombre de un usuario, se llama a
// supabaseAnon.auth.setSession(accessToken) o se pasa el JWT en cada request.
export const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // El backend no persiste sesiones en cookies ni localStorage.
    // Cada request es stateless y lleva su propio JWT.
    autoRefreshToken: false,
    persistSession:   false,
    detectSessionInUrl: false,
  },
});

// ── Cliente ADMIN (bypasea RLS) ──────────────────────────────────────────────
// Úsalo SOLO para operaciones de servidor que el usuario no debe controlar:
// - Crear/modificar perfiles tras verificar un OTP
// - Leer datos para procesos internos (ej: pagos Wompi)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken:   false,
    persistSession:     false,
    detectSessionInUrl: false,
  },
});
