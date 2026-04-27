import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import * as skillsController from './skills.controller.js';

const router = Router();

// Públicos pero requieren estar logueados (Cualquiera puede ver categorias y skills)
router.use(requireAuth);

router.get('/categories', skillsController.getCategories);
router.get('/list', skillsController.getSkills);

// Solo kamelladores gestionan sus propias habilidades
router.get('/my-skills', requireRole(['kamellador']), skillsController.getMySkills);
router.post('/my-skills', requireRole(['kamellador']), skillsController.addMySkill);
router.delete('/my-skills/:skill_id', requireRole(['kamellador']), skillsController.deleteMySkill);

export default router;
