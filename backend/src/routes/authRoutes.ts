import { Router } from 'express';
import { getMe, login } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateJWT, getMe);

export default router;
