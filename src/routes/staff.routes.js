import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  getStaff,
  createStaff,
  getStaffPerformance
} from '../controllers/staff.controller.js';

const router = express.Router();

router.use(verifyToken, requireRole('super_admin', 'ceo', 'branch_manager'));

router.get('/', getStaff);

router.post('/', validate([
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'branch_manager', 'stylist', 'inventory_manager']).withMessage('Invalid role')
]), createStaff);

router.get('/:id/performance', getStaffPerformance);

export default router;
