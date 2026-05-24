import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  bookConsultation,
  getConsultations,
  getConsultationById,
  updateConsultationStatus,
  addConsultationNotes
} from '../controllers/consultation.controller.js';

const router = express.Router();

router.use(verifyToken);

router.post('/book', validate([
  body('expert_id').notEmpty().withMessage('Expert ID is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('time_slot').notEmpty().withMessage('Time slot is required')
]), bookConsultation);

router.get('/', getConsultations);

router.get('/:id', getConsultationById);

router.patch('/:id/status', requireRole('super_admin', 'branch_manager', 'stylist'), validate([
  body('status').notEmpty().withMessage('Status is required')
]), updateConsultationStatus);

router.post('/:id/notes', requireRole('stylist'), validate([
  body('notes').notEmpty().withMessage('Notes are required')
]), addConsultationNotes);

export default router;
