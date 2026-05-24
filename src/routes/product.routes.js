import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { uploadArray } from '../middleware/upload.middleware.js';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  addVariant,
  removeVariant
} from '../controllers/product.controller.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

router.post('/', verifyToken, requireRole('super_admin', 'ceo', 'admin'), validate([
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isInt({ min: 0 }).withMessage('Price must be a positive integer in paise')
]), createProduct);

router.put('/:id', verifyToken, requireRole('super_admin', 'ceo', 'admin'), updateProduct);

router.delete('/:id', verifyToken, requireRole('super_admin', 'ceo', 'admin'), deleteProduct);

router.post('/:id/images', verifyToken, requireRole('super_admin', 'ceo', 'admin'), uploadArray('images', 10), uploadProductImages);

router.post('/:id/variants', verifyToken, requireRole('super_admin', 'ceo', 'admin'), validate([
  body('size').optional().isString(),
  body('color').optional().isString(),
  body('stock').optional().isInt({ min: 0 })
]), addVariant);

router.delete('/:id/variants/:variantId', verifyToken, requireRole('super_admin', 'ceo', 'admin'), removeVariant);

export default router;
