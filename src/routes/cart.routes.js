import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from '../controllers/cart.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getCart);

router.post('/', validate([
  body('product_id').notEmpty().withMessage('Product ID is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1')
]), addToCart);

router.put('/:itemId', validate([
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
]), updateCartItem);

router.delete('/:itemId', removeCartItem);

router.delete('/', clearCart);

export default router;
