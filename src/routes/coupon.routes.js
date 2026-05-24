import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  getCoupons,
  createCoupon,
  validateCoupon,
  updateCoupon,
  deleteCoupon
} from '../controllers/coupon.controller.js';

const router = express.Router();

router.use(verifyToken);

router.post('/validate', validate([
  body('code').notEmpty().withMessage('Coupon code is required'),
  body('orderTotal').isInt({ min: 1 }).withMessage('Order total must be an integer')
]), validateCoupon);

router.get('/', requireRole('super_admin', 'ceo', 'admin'), getCoupons);

router.post('/', requireRole('super_admin', 'ceo', 'admin'), validate([
  body('code').notEmpty(),
  body('type').isIn(['percent', 'flat']),
  body('discount_value').isInt({ min: 1 }),
  body('min_order').isInt({ min: 0 })
]), createCoupon);

router.patch('/:id', requireRole('super_admin', 'ceo', 'admin'), updateCoupon);

router.delete('/:id', requireRole('super_admin', 'ceo', 'admin'), deleteCoupon);

export default router;
