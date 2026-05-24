import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch
} from '../controllers/branch.controller.js';

const router = express.Router();

router.get('/', getBranches);
router.get('/:id', getBranchById);

router.post('/', verifyToken, requireRole('super_admin', 'ceo', 'admin'), validate([
  body('name').notEmpty().withMessage('Name is required')
]), createBranch);

router.put('/:id', verifyToken, requireRole('super_admin', 'ceo', 'admin'), updateBranch);

export default router;
