import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  broadcastNotification
} from '../controllers/notification.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getNotifications);

router.patch('/read-all', markAllAsRead);

router.patch('/:id/read', markAsRead);

router.post('/broadcast', requireRole('super_admin', 'ceo'), validate([
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required')
]), broadcastNotification);

export default router;
