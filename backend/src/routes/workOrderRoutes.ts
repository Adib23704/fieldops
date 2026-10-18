import { Router } from 'express';
import { createItem, removeItem } from '../controllers/itemController';
import {
  createOrder,
  getOrder,
  listOrders,
  updateStatus,
} from '../controllers/workOrderController';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', listOrders);
router.post('/', requireRole('ADMIN', 'DISPATCHER'), createOrder);
router.get('/:id', getOrder);
router.patch('/:id/status', updateStatus);

router.post('/:id/items', createItem);
router.delete('/:id/items/:itemId', removeItem);

export default router;
