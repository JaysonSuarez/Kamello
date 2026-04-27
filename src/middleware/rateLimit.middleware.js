/**
 * @file rateLimit.middleware.js
 * @description Simple in-memory rate limiter middleware for Kamello.
 *
 * Uses a Map to track request counts per IP address.
 * No external packages required.
 *
 * Limits:
 *   - OTP endpoints: max 5 requests per 15 minutes per IP
 *   - General API:   max 100 requests per minute per IP
 */

/**
 * Creates a rate limiter middleware.
 *
 * @param {object} options
 * @param {number} options.windowMs   - Time window in milliseconds
 * @param {number} options.max        - Max requests allowed per window
 * @param {string} options.message    - User-facing error message (Spanish)
 * @returns {import('express').RequestHandler}
 */
function createRateLimiter({ windowMs, max, message }) {
  // Map<ip, { count: number, resetAt: number }>
  const store = new Map();

  // Periodically clean up expired entries to avoid memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of store.entries()) {
      if (now >= record.resetAt) {
        store.delete(ip);
      }
    }
  }, windowMs).unref(); // .unref() so it doesn't keep the process alive

  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    const record = store.get(ip);

    if (!record || now >= record.resetAt) {
      // First request in this window (or window expired)
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
        },
      });
    }

    record.count += 1;
    next();
  };
}

/**
 * Rate limiter for OTP endpoints.
 * Max 5 requests per 15 minutes per IP.
 */
export const rateLimitOtp = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Demasiados intentos. Por favor espera 15 minutos antes de volver a intentarlo.',
});

/**
 * Rate limiter for general API routes.
 * Max 100 requests per minute per IP.
 */
export const rateLimitGeneral = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Demasiadas solicitudes. Por favor intenta de nuevo en un momento.',
});
