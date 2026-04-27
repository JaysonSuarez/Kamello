/**
 * @file role.middleware.js
 * @description Middleware de autorización basado en roles.
 *
 * Se usa DESPUÉS de requireAuth. Verifica que el usuario autenticado
 * tenga el rol correcto para acceder a un recurso específico.
 *
 * Uso en rutas:
 *   router.post('/ops', requireAuth, requireRole('kamellador'), controller)
 *   router.get('/clients', requireAuth, requireRole('client'), controller)
 */

/**
 * Fábrica de middleware: requireRole
 * Retorna un middleware que verifica que req.user tenga el rol esperado.
 *
 * @param {...string} roles - Roles permitidos. Acepta múltiples: requireRole('client', 'kamellador')
 * @returns {import('express').RequestHandler}
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    // requireRole debe usarse después de requireAuth.
    // Si req.user no existe, hay un error de configuración de rutas.
    if (!req.user) {
      return res.status(500).json({
        error: 'Error de configuración',
        message: 'requireRole debe usarse después de requireAuth.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: `Esta acción requiere el rol: ${roles.join(' o ')}. Tu rol actual es: ${req.user.role}.`,
      });
    }

    next();
  };
}
