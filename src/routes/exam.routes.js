import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  getCourseExams,
  createExam,
  attemptExam,
  getExamResults,
  getStudentExamResult
} from '../controllers/exam.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/course/:courseId', getCourseExams);

router.post('/course/:courseId', requireRole('faculty', 'super_admin'), validate([
  body('title').notEmpty().withMessage('Title is required')
]), createExam);

router.post('/:id/attempt', validate([
  body('answers').isArray().withMessage('Answers array is required')
]), attemptExam);

router.get('/:id/results', requireRole('faculty', 'super_admin'), getExamResults);

router.get('/:id/results/:studentId', getStudentExamResult);

export default router;
