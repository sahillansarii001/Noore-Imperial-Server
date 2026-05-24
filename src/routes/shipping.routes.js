import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  createOrderShipment,
  trackOrderShipment
} from '../controllers/shipping.controller.js';

const router = express.Router();

router.use(verifyToken);

router.post('/create', requireRole('super_admin', 'branch_manager'), validate([
  body('orderId').notEmpty().withMessage('Order ID is required')
]), createOrderShipment);

router.get('/track/:awb', trackOrderShipment);

export default router;
