/**
 * @file auth.routes.js
 * @description Rutas públicas y protegidas del módulo de autenticación.
 *
 * Rutas:
 *  POST /send-otp   → Pública. Envía código OTP.
 *  POST /verify-otp → Pública. Verifica código y retorna sesión.
 *  GET  /me         → Protegida. Retorna perfil del usuario autenticado.
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import * as authController from './auth.controller.js';

const router = Router();

// ── Rutas públicas (sin autenticación) ───────────────────────────────────────

/**
 * @route   POST /api/v1/auth/send-otp
 * @desc    Envía OTP por SMS o email para registro/login
 * @access  Público
 * @body    { contact: string, role: 'client'|'kamellador', full_name: string }
 */
router.post('/send-otp', authController.sendOtp);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verifica el OTP y retorna access_token + perfil
 * @access  Público
 * @body    { contact: string, token: string }
 */
router.post('/verify-otp', authController.verifyOtp);

// ── Rutas protegidas (requieren JWT válido) ───────────────────────────────────

/**
 * @route   GET /api/v1/auth/me
 * @desc    Retorna el perfil completo del usuario autenticado
 * @access  Privado (requireAuth)
 * @header  Authorization: Bearer <accessToken>
 */
router.get('/me', requireAuth, authController.getMe);

export default router;
