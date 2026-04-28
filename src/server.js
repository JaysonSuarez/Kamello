/**
 * @file server.js
 * @description Kamello — API + Frontend unificado.
 * Un solo `npm run dev` sirve todo en http://localhost:3000
 */

import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import path    from 'path';
import { fileURLToPath } from 'url';

// Middleware
import { requestLogger, logError }          from './middleware/logger.middleware.js';
import { rateLimitOtp, rateLimitGeneral }   from './middleware/rateLimit.middleware.js';

// Utils
import { AppError } from './utils/errors.js';

// Rutas de módulos
import authRoutes       from './modules/auth/auth.routes.js';
import profileRoutes    from './modules/profiles/profiles.routes.js';
import skillsRoutes     from './modules/skills/skills.routes.js';
import operationsRoutes from './modules/operations/operations.routes.js';
import pushRoutes       from './modules/push/push.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

// ── ARCHIVOS ESTÁTICOS PRIMERO (antes de CORS para que no los bloquee) ────────
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// ── Request logger (lo más temprano posible) ──────────────────────────────────
app.use(requestLogger);

// ── CORS (solo se aplica a las rutas de la API) ───────────────────────────────
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS 
  ? process.env.CORS_ALLOWED_ORIGINS.split(',') 
  : '*';

app.use('/api', cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Parseo del body ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Rate limiting general para todas las rutas /api ───────────────────────────
app.use('/api', rateLimitGeneral);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok', service: 'kamello',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API v1 Routes ─────────────────────────────────────────────────────────────
// OTP rate limiting aplicado antes del router de auth
app.use('/api/v1/auth/send-otp',  rateLimitOtp);
app.use('/api/v1/auth/verify-otp', rateLimitOtp);

app.use('/api/v1/auth',     authRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/skills',   skillsRoutes);
app.use('/api/v1/ops',      operationsRoutes);
app.use('/api/v1/operations', operationsRoutes);
app.use('/api/v1/push',     pushRoutes);

// ── API 404 ───────────────────────────────────────────────────────────────────
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint no encontrado en la API.' } });
});

// ── SPA Fallback ──────────────────────────────────────────────────────────────
// Cualquier otra ruta que no sea archivo estático ni API → index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// ── Handler global de errores ─────────────────────────────────────────────────
const isDev = process.env.NODE_ENV !== 'production';

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Zod validation errors
  if (err.name === 'ZodError') {
    logError(err, 'ZodError');
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de entrada inválidos.',
        ...(isDev ? { details: err.errors } : {}),
      },
    });
  }

  // Known application errors (AppError subclasses)
  if (err instanceof AppError) {
    logError(err, err.code);
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(isDev ? { stack: err.stack } : {}),
      },
    });
  }

  // Unknown / unexpected errors
  logError(err, 'UnhandledError');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev ? err.message : 'Error interno del servidor.',
      ...(isDev ? { stack: err.stack } : {}),
    },
  });
});

// ── Arranque ──────────────────────────────────────────────────────────────────
// Si estamos en Vercel, no iniciamos el servidor manualmente, exportamos la app.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
  ╔════════════════════════════════════════╗
  ║         KAMELLO  🐪                    ║
  ╠════════════════════════════════════════╣
  ║  Estado:   Corriendo                   ║
  ║  Puerto:   ${String(PORT).padEnd(10)}               ║
  ║  Entorno:  ${(process.env.NODE_ENV || 'development').padEnd(10)}               ║
  ║  Frontend: http://localhost:${PORT}       ║
  ╚════════════════════════════════════════╝
    `);
  });
}

export default app;
