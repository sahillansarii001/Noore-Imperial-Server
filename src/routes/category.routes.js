import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  getCategories,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/:slug/products', getCategoryProducts);

router.post('/', verifyToken, requireRole('super_admin', 'ceo', 'admin'), validate([
  body('name').notEmpty().withMessage('Name is required')
]), createCategory);

router.put('/:id', verifyToken, requireRole('super_admin', 'ceo', 'admin'), updateCategory);

router.delete('/:id', verifyToken, requireRole('super_admin', 'ceo', 'admin'), deleteCategory);

export default router;
