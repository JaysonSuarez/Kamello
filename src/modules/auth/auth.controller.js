/**
 * @file auth.controller.js
 * @description Controlador HTTP del módulo de autenticación.
 *
 * Responsabilidades:
 *  1. Validar el body del request con Zod
 *  2. Llamar al servicio correspondiente
 *  3. Formatear y enviar la respuesta HTTP
 *
 * El controlador NO contiene lógica de negocio. Si hay que hablar
 * con Supabase, eso va en auth.service.js.
 */

import { z } from 'zod';
import * as authService from './auth.service.js';

// ── Schemas de validación con Zod ────────────────────────────────────────────

/**
 * Schema para enviar OTP.
 * El campo `contact` acepta teléfono en formato E.164 (+573001234567)
 * o email, dependiendo de AUTH_OTP_METHOD.
 */
const sendOtpSchema = z.object({
  contact: z.string().min(5, 'El campo contact (teléfono o email) es requerido.'),
  role:    z.enum(['client', 'kamellador'], {
    errorMap: () => ({ message: 'El rol debe ser "client" o "kamellador".' }),
  }),
  full_name: z.string()
    .min(2, 'El nombre completo debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede superar los 100 caracteres.'),
});

/**
 * Schema para verificar OTP.
 * `token` es el código de 6 dígitos enviado por SMS o email.
 */
const verifyOtpSchema = z.object({
  contact: z.string().min(5, 'El campo contact es requerido.'),
  token:   z.string().length(6, 'El código de verificación debe tener exactamente 6 dígitos.'),
});

// ── Handlers ─────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/send-otp
 * Envía el código OTP al teléfono o email del usuario.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function sendOtp(req, res, next) {
  try {
    // ── Validación del body ──────────────────────────────────
    const parsed = sendOtpSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error:   'Datos inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await authService.sendOtp(parsed.data);

    return res.status(200).json(result);

  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/verify-otp
 * Verifica el código OTP. Si es correcto, retorna los tokens de sesión.
 *
 * Response exitoso:
 * {
 *   accessToken:  string,
 *   refreshToken: string,
 *   expiresAt:    number,
 *   user: { id, role, full_name, phone, avatar_url, ... }
 * }
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function verifyOtp(req, res, next) {
  try {
    const parsed = verifyOtpSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error:   'Datos inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await authService.verifyOtp(parsed.data);

    return res.status(200).json(result);

  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/auth/me
 * Retorna el perfil del usuario autenticado.
 * Requiere: requireAuth middleware.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function getMe(req, res, next) {
  try {
    // req.user fue adjuntado por requireAuth y ya contiene el perfil.
    // Hacemos una lectura fresca desde la DB para datos siempre actualizados.
    const profile = await authService.getMe(req.user.id);

    return res.status(200).json({ user: profile });

  } catch (err) {
    next(err);
  }
}
