import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  getCourses,
  getCourseBySlug,
  createCourse,
  updateCourse,
  getEnrolledStudents
} from '../controllers/course.controller.js';

const router = express.Router();

router.get('/', getCourses);
router.get('/:slug', getCourseBySlug);

router.post('/', verifyToken, requireRole('faculty', 'super_admin', 'ceo'), validate([
  body('title').notEmpty().withMessage('Title is required'),
  body('price').isInt({ min: 0 }).withMessage('Price must be a valid integer in paise')
]), createCourse);

router.put('/:id', verifyToken, requireRole('faculty', 'super_admin', 'ceo'), updateCourse);

router.get('/:id/students', verifyToken, requireRole('faculty', 'super_admin', 'ceo'), getEnrolledStudents);

export default router;
