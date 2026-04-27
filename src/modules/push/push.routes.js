import { Router } from 'express';
import * as pushController from './push.controller.js';

const router = Router();

// Para suscribir un usuario
router.post('/subscribe', pushController.subscribe);

// Para que nosotros (el sistema) enviemos notificaciones
router.post('/send', pushController.sendNotification);

export default router;
