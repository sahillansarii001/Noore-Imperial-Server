import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  submitFranchiseApplication,
  getFranchiseApplications,
  updateFranchiseApplicationStatus
} from '../controllers/franchise.controller.js';

const router = express.Router();

router.post('/apply', validate([
  body('applicant_name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required')
]), submitFranchiseApplication);

router.get('/applications', verifyToken, requireRole('super_admin', 'ceo'), getFranchiseApplications);

router.patch('/applications/:id/status', verifyToken, requireRole('super_admin', 'ceo'), validate([
  body('status').notEmpty().withMessage('Status is required')
]), updateFranchiseApplicationStatus);

export default router;
