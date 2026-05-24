import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  getExperts,
  getExpertById,
  createExpert,
  updateExpert
} from '../controllers/expert.controller.js';

const router = express.Router();

router.get('/', getExperts);
router.get('/:id', getExpertById);

router.post('/', verifyToken, requireRole('super_admin', 'ceo', 'admin'), validate([
  body('user_id').notEmpty().withMessage('User ID is required'),
  body('name').notEmpty().withMessage('Name is required')
]), createExpert);

router.put('/:id', verifyToken, requireRole('super_admin', 'ceo', 'admin'), updateExpert);

export default router;
