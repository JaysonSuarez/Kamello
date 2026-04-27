import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import * as profileController from './profiles.controller.js';

const router = Router();

// Ruta pública: listado de kamelladores (requiere auth básica)
router.get('/kamelladores', requireAuth, profileController.getKamelladores);

// Rutas de perfil propio — requieren autenticación
router.use(requireAuth);

router.get('/me', profileController.getProfile);
router.put('/me', profileController.updateProfile);
// router.get('/:id', profileController.getById);

export default router;
