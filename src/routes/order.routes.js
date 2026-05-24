import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  returnOrder,
  getOrderInvoice
} from '../controllers/order.controller.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', validate([
  body('address_id').notEmpty().withMessage('Address ID is required'),
  body('items').isArray({ min: 1 }).withMessage('Items array is required'),
  body('payment_method').notEmpty().withMessage('Payment method is required')
]), createOrder);

router.get('/', getOrders);

router.get('/:id', getOrderById);

router.patch('/:id/status', requireRole('super_admin', 'ceo', 'branch_manager'), validate([
  body('status').notEmpty().withMessage('Status is required')
]), updateOrderStatus);

router.post('/:id/cancel', cancelOrder);

router.post('/:id/return', returnOrder);

router.get('/:id/invoice', getOrderInvoice);

export default router;
