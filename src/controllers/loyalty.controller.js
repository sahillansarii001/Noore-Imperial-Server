import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';

export const getLoyaltyInfo = async (req, res, next) => {
  try {
    const { rows: userRows } = await pool.query('SELECT loyalty_points FROM users WHERE id = $1', [req.user.id]);
    const { rows: history } = await pool.query('SELECT * FROM loyalty_transactions WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    
    return success(res, { points: userRows[0].loyalty_points, history }, 'Loyalty info retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const redeemLoyaltyPoints = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { points, orderId } = req.body;
    
    if (points <= 0) throw new Error('Points must be positive');

    const { rows: userRows } = await client.query('SELECT loyalty_points FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
    if (userRows[0].loyalty_points < points) throw new Error('Insufficient loyalty points');

    // 1 point = 100 paise (1 INR)
    const discountInPaise = points * 100;

    await client.query('UPDATE users SET loyalty_points = loyalty_points - $1 WHERE id = $2', [points, req.user.id]);
    
    await client.query(
      `INSERT INTO loyalty_transactions (user_id, points, type, description) VALUES ($1, $2, 'redeemed', $3)`,
      [req.user.id, points, `Redeemed for order ${orderId}`]
    );

    await client.query('COMMIT');
    return success(res, { discountInPaise }, 'Points redeemed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    return error(res, err.message || 'Failed to redeem points', 400);
  } finally {
    client.release();
  }
};
