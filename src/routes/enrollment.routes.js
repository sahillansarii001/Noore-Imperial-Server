import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  enrollInCourse,
  getMyEnrollments,
  updateProgress
} from '../controllers/enrollment.controller.js';

const router = express.Router();

router.use(verifyToken);

router.post('/courses/:courseId/enroll', enrollInCourse);

router.get('/my', getMyEnrollments);

router.patch('/:id/progress', validate([
  body('progress').isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100')
]), updateProgress);

export default router;
