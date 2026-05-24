import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  createOrderPayment,
  verifyPayment,
  initiateRefund
} from '../controllers/payment.controller.js';

const router = express.Router();

router.use(verifyToken);

router.post('/create-order', validate([
  body('amount').isInt({ min: 100 }).withMessage('Amount must be positive integer in paise')
]), createOrderPayment);

router.post('/verify', validate([
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
  body('order_id').notEmpty()
]), verifyPayment);

router.post('/refund', requireRole('super_admin', 'ceo'), validate([
  body('paymentId').notEmpty()
]), initiateRefund);

export default router;
