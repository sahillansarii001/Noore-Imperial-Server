import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import {
  getCourseAssignments,
  createAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission
} from '../controllers/assignment.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/course/:courseId', getCourseAssignments);

router.post('/course/:courseId', requireRole('faculty', 'super_admin'), validate([
  body('title').notEmpty().withMessage('Title is required')
]), createAssignment);

router.post('/:id/submit', uploadSingle('file'), submitAssignment);

router.get('/:id/submissions', requireRole('faculty', 'super_admin'), getSubmissions);

router.patch('/submissions/:id', requireRole('faculty', 'super_admin'), validate([
  body('grade').notEmpty().withMessage('Grade is required')
]), gradeSubmission);

export default router;
