import { success, error } from '../utils/response.js';
import { pool } from '../config/db.js';
import {
  getRevenueByPeriod as sGetRevenue,
  getBestSellingProducts as sGetBestSelling,
  getCustomerStats as sGetCustomerStats,
  getBranchRevenue as sGetBranchRevenue,
  getAcademyStats as sGetAcademyStats,
  getOrderStats as sGetOrderStats
} from '../services/analytics.service.js';

export const getRevenueByPeriod = async (req, res, next) => {
  try {
    const period = req.query.period || 'monthly';
    const data = await sGetRevenue(period);
    return success(res, data, 'Revenue retrieved');
  } catch (err) {
    next(err);
  }
};

export const getOrderStats = async (req, res, next) => {
  try {
    const data = await sGetOrderStats();
    return success(res, data, 'Order stats retrieved');
  } catch (err) {
    next(err);
  }
};

export const getBestSellingProducts = async (req, res, next) => {
  try {
    const data = await sGetBestSelling(10);
    return success(res, data, 'Best selling products retrieved');
  } catch (err) {
    next(err);
  }
};

export const getCustomerStats = async (req, res, next) => {
  try {
    const data = await sGetCustomerStats();
    return success(res, data, 'Customer stats retrieved');
  } catch (err) {
    next(err);
  }
};

export const getBranchRevenue = async (req, res, next) => {
  try {
    const data = await sGetBranchRevenue();
    return success(res, data, 'Branch revenue retrieved');
  } catch (err) {
    next(err);
  }
};

export const getAcademyStats = async (req, res, next) => {
  try {
    const data = await sGetAcademyStats();
    return success(res, data, 'Academy stats retrieved');
  } catch (err) {
    next(err);
  }
};

export const getSeoSitemapData = async (req, res, next) => {
  try {
    const { rows: products } = await pool.query('SELECT slug, updated_at FROM products WHERE is_active = true');
    const { rows: courses } = await pool.query('SELECT slug, updated_at FROM courses WHERE is_active = true');
    const { rows: categories } = await pool.query('SELECT slug, updated_at FROM categories WHERE is_active = true');

    return success(res, { products, courses, categories }, 'Sitemap data retrieved');
  } catch (err) {
    next(err);
  }
};
