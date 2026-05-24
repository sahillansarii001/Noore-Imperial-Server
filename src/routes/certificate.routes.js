import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getMyCertificates,
  verifyCertificate
} from '../controllers/certificate.controller.js';

const router = express.Router();

router.get('/my', verifyToken, getMyCertificates);
router.get('/verify/:id', verifyCertificate);

export default router;
