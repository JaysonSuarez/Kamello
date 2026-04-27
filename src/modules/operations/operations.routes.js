import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import * as operationsController from './operations.controller.js';

const router = Router();

// Todas las operaciones requieren auth
router.use(requireAuth);

router.post('/', requireRole('client'), operationsController.createOperation);
router.get('/', operationsController.getMyOperations);
router.patch('/:id/start', requireRole('kamellador'), operationsController.startOperation);
router.patch('/:id/complete', requireRole('kamellador'), operationsController.completeOperation);
router.post('/:id/rate', requireRole('client'), operationsController.rateOperation);
router.patch('/:id/status', operationsController.updateStatus);

export default router;
