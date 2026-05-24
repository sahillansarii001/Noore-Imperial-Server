import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';

export const getWishlist = async (req, res, next) => {
  try {
    const query = `
      SELECT w.id as wishlist_item_id, w.created_at,
             p.id as product_id, p.name as product_name, p.slug as product_slug, p.price, p.discount_price, p.images, p.stock
      FROM wishlist_items w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `;
    const { rows } = await pool.query(query, [req.user.id]);
    
    return success(res, rows, 'Wishlist retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const { product_id } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO wishlist_items (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING *`,
      [req.user.id, product_id]
    );

    // If rows is empty, it means it was a duplicate and ignored.
    return success(res, rows[0] || null, 'Item added to wishlist', 201);
  } catch (err) {
    next(err);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    
    const { rowCount } = await pool.query('DELETE FROM wishlist_items WHERE product_id = $1 AND user_id = $2', [productId, req.user.id]);
    
    if (rowCount === 0) return error(res, 'Item not found in wishlist', 404);
    return success(res, null, 'Item removed from wishlist');
  } catch (err) {
    next(err);
  }
};
