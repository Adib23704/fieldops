import { Router } from 'express';
import { listTechnicians } from '../controllers/userController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/technicians', listTechnicians);

export default router;
