import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  getInventoryLogs,
  updateInventory
} from '../controllers/inventory.controller.js';

const router = express.Router();

router.use(verifyToken, requireRole('super_admin', 'inventory_manager', 'admin'));

router.get('/logs', getInventoryLogs);

router.post('/update', validate([
  body('product_id').notEmpty().withMessage('Product ID is required'),
  body('quantity_change').isInt().withMessage('Quantity change must be an integer (positive or negative)')
]), updateInventory);

export default router;
