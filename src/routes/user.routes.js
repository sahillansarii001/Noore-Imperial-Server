import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  getMe,
  updateMe,
  updatePassword,
  getMyAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getAllUsers,
  getUserById,
  updateUserRole
} from '../controllers/user.controller.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/me', getMe);

router.put('/me', updateMe);

router.put('/me/password', validate([
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
]), updatePassword);

router.get('/me/addresses', getMyAddresses);

router.post('/me/addresses', validate([
  body('street').notEmpty().withMessage('Street is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('pincode').notEmpty().withMessage('Pincode is required')
]), addAddress);

router.put('/me/addresses/:id', updateAddress);

router.delete('/me/addresses/:id', deleteAddress);

// Admin routes
router.get('/', requireRole('super_admin', 'ceo'), getAllUsers);

router.get('/:id', requireRole('super_admin', 'ceo'), getUserById);

router.patch('/:id/role', requireRole('super_admin'), validate([
  body('role').notEmpty().withMessage('Role is required')
]), updateUserRole);

export default router;
