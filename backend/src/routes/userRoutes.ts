import { Router } from 'express';
import { createTechnician, listTechnicians, updateTechnician } from '../controllers/userController';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/technicians', listTechnicians);
router.post('/technicians', requireRole('ADMIN'), createTechnician);
router.patch('/technicians/:id', requireRole('ADMIN'), updateTechnician);

export default router;
