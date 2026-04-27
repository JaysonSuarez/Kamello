/**
 * @file auth.middleware.js
 * @description Middleware de autenticación para Express.
 *
 * Verifica el JWT de Supabase en el header Authorization de cada
 * request protegido. Si el token es válido, adjunta el usuario
 * a `req.user` para que los controladores puedan usarlo.
 *
 * Flujo:
 *   1. Lee header: Authorization: Bearer <token>
 *   2. Llama a Supabase para validar el token
 *   3. Lee el perfil del usuario desde public.profiles
 *   4. Adjunta { id, role, full_name, ... } a req.user
 *   5. Llama a next() o responde con 401
 */

import { supabaseAdmin } from '../config/supabase.js';

/**
 * Middleware: requireAuth
 * Protege rutas que necesitan un usuario autenticado.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function requireAuth(req, res, next) {
  try {
    // ── 1. Extraer el token del header ──────────────────────
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Se requiere un token de acceso en el header Authorization.',
      });
    }

    const token = authHeader.split(' ')[1];

    // ── 2. Validar el JWT con Supabase ───────────────────────
    // getUser() valida la firma y la expiración del token.
    // Es la forma correcta de verificar tokens de Supabase Auth.
    const { data: { user: authUser }, error: authError } = await supabaseAdmin
      .auth
      .getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token expiró o no es válido. Vuelve a iniciar sesión.',
      });
    }

    // ── 3. Leer perfil extendido desde public.profiles ───────
    // auth.users solo tiene datos de auth. El rol y nombre
    // los guardamos en public.profiles (creado por el trigger).
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name, phone, avatar_url, specialty, is_online, rating_avg, rating_count, is_active')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      // Esto no debería pasar si el trigger funciona correctamente.
      // Si ocurre, es un error de integridad de datos.
      return res.status(401).json({
        error: 'Perfil no encontrado',
        message: 'El usuario existe en auth pero no tiene perfil. Contacta soporte.',
      });
    }

    // ── 4. Verificar que la cuenta esté activa ───────────────
    if (!profile.is_active) {
      return res.status(403).json({
        error: 'Cuenta desactivada',
        message: 'Tu cuenta ha sido desactivada. Contacta soporte en Kamello.',
      });
    }

    // ── 5. Adjuntar usuario al request ───────────────────────
    req.user = profile;

    next();
  } catch (err) {
    // Error inesperado: lo pasamos al error handler global
    next(err);
  }
}
