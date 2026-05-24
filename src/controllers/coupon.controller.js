import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';

export const getCoupons = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    return success(res, rows, 'Coupons retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const { code, type, discount_value, min_order, max_discount, expiry, max_uses } = req.body;
    
    const { rows: existing } = await pool.query('SELECT id FROM coupons WHERE code = $1', [code.toUpperCase()]);
    if (existing.length > 0) return error(res, 'Coupon code already exists', 400);
    
    const { rows } = await pool.query(
      `INSERT INTO coupons (code, type, discount_value, min_order, max_discount, expiry, max_uses)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [code.toUpperCase(), type, discount_value, min_order, max_discount, expiry, max_uses]
    );
    
    return success(res, rows[0], 'Coupon created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderTotal } = req.body;
    
    const { rows } = await pool.query('SELECT * FROM coupons WHERE code = $1 AND is_active = true', [code.toUpperCase()]);
    if (rows.length === 0) return error(res, 'Invalid or inactive coupon', 400);
    
    const coupon = rows[0];
    
    if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
      return error(res, 'Coupon has expired', 400);
    }
    
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return error(res, 'Coupon usage limit reached', 400);
    }
    
    if (orderTotal < coupon.min_order) {
      return error(res, `Minimum order amount for this coupon is ${coupon.min_order / 100}`, 400);
    }
    
    let discountAmount = 0;
    if (coupon.type === 'flat') {
      discountAmount = coupon.discount_value;
    } else if (coupon.type === 'percent') {
      discountAmount = Math.floor(orderTotal * (coupon.discount_value / 100));
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    }
    
    return success(res, { valid: true, discountAmount }, 'Coupon is valid');
  } catch (err) {
    next(err);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active, max_uses, expiry } = req.body;
    
    const { rows } = await pool.query(
      `UPDATE coupons 
       SET is_active = COALESCE($1, is_active), 
           max_uses = COALESCE($2, max_uses), 
           expiry = COALESCE($3, expiry),
           updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [is_active, max_uses, expiry, id]
    );
    
    if (rows.length === 0) return error(res, 'Coupon not found', 404);
    return success(res, rows[0], 'Coupon updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { rowCount } = await pool.query('DELETE FROM coupons WHERE id = $1', [id]);
    
    if (rowCount === 0) return error(res, 'Coupon not found', 404);
    return success(res, null, 'Coupon deleted successfully');
  } catch (err) {
    next(err);
  }
};
