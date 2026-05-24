import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  addReview,
  getProductReviews,
  deleteReview
} from '../controllers/review.controller.js';

const router = express.Router();

router.get('/products/:productId', getProductReviews);

router.post('/products/:productId', verifyToken, validate([
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString()
]), addReview);

router.delete('/:id', verifyToken, deleteReview);

export default router;
