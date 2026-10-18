import { Router } from 'express';
import {
  evaluateTriageLog,
  executeTriage,
  getMetrics,
  listTriageLogs,
} from '../controllers/aiController';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.post('/triage', requireRole('ADMIN', 'DISPATCHER'), executeTriage);
router.get('/metrics', getMetrics);
router.get('/logs', listTriageLogs);
router.patch('/logs/:id/evaluate', requireRole('ADMIN', 'DISPATCHER'), evaluateTriageLog);

export default router;
