import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  register,
  login,
  logout,
  refreshToken,
  sendOtp,
  verifyOtpController,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';

const router = express.Router();

router.use(authLimiter);

router.post('/register', validate([
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
]), register);

router.post('/login', validate([
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
]), login);

router.post('/logout', logout);

router.post('/refresh-token', refreshToken);

router.post('/send-otp', validate([
  body('email').isEmail().withMessage('Valid email is required')
]), sendOtp);

router.post('/verify-otp', validate([
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').notEmpty().withMessage('OTP is required')
]), verifyOtpController);

router.post('/forgot-password', validate([
  body('email').isEmail().withMessage('Valid email is required')
]), forgotPassword);

router.post('/reset-password', validate([
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
]), resetPassword);

export default router;
