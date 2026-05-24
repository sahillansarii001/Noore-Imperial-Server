import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  getCourseLectures,
  getLectureById,
  createLecture,
  updateLecture,
  deleteLecture
} from '../controllers/lecture.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/course/:courseId', getCourseLectures);
router.get('/:id', getLectureById);

router.post('/course/:courseId', requireRole('faculty', 'super_admin'), validate([
  body('title').notEmpty().withMessage('Title is required')
]), createLecture);

router.put('/:id', requireRole('faculty', 'super_admin'), updateLecture);

router.delete('/:id', requireRole('faculty', 'super_admin'), deleteLecture);

export default router;
