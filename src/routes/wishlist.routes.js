import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} from '../controllers/wishlist.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getWishlist);

router.post('/', validate([
  body('product_id').notEmpty().withMessage('Product ID is required')
]), addToWishlist);

router.delete('/:productId', removeFromWishlist);

export default router;
