import { Router } from 'express';
import {
  createCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from '../controllers/customerController';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', listCustomers);
router.get('/:id', getCustomer);
router.post('/', requireRole('ADMIN', 'DISPATCHER'), createCustomer);
router.patch('/:id', requireRole('ADMIN'), updateCustomer);

export default router;
