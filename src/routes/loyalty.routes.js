import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getLoyaltyInfo,
  redeemLoyaltyPoints
} from '../controllers/loyalty.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getLoyaltyInfo);

router.post('/redeem', validate([
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('orderId').notEmpty().withMessage('Order ID is required')
]), redeemLoyaltyPoints);

export default router;
