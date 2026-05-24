import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  getRevenueByPeriod,
  getOrderStats,
  getBestSellingProducts,
  getCustomerStats,
  getBranchRevenue,
  getAcademyStats,
  getSeoSitemapData
} from '../controllers/analytics.controller.js';

const router = express.Router();

router.get('/seo/sitemap-data', getSeoSitemapData);

router.use(verifyToken, requireRole('super_admin', 'ceo', 'admin'));

router.get('/revenue', getRevenueByPeriod);
router.get('/orders', getOrderStats);
router.get('/products', getBestSellingProducts);
router.get('/customers', getCustomerStats);
router.get('/branches', getBranchRevenue);
router.get('/academy', getAcademyStats);

export default router;
