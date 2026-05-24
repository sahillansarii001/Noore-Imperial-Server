import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';

export const getCart = async (req, res, next) => {
  try {
    const query = `
      SELECT ci.id as cart_item_id, ci.quantity, ci.created_at,
             p.id as product_id, p.name as product_name, p.slug as product_slug, p.price as base_price, p.discount_price, p.images, p.stock as product_stock,
             pv.id as variant_id, pv.size, pv.color, pv.price_modifier, pv.stock as variant_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `;
    const { rows } = await pool.query(query, [req.user.id]);
    
    // Calculate total price for convenience
    let cartTotal = 0;
    rows.forEach(item => {
      const activePrice = item.discount_price || item.base_price;
      const finalPrice = activePrice + (item.price_modifier || 0);
      item.final_price = finalPrice;
      cartTotal += finalPrice * item.quantity;
    });

    return success(res, { items: rows, cartTotal }, 'Cart retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { product_id, variant_id, quantity = 1 } = req.body;

    // Verify stock
    if (variant_id) {
      const { rows: vRows } = await pool.query('SELECT stock FROM product_variants WHERE id = $1', [variant_id]);
      if (vRows.length === 0 || vRows[0].stock < quantity) {
        return error(res, 'Not enough stock for this variant', 400);
      }
    } else {
      const { rows: pRows } = await pool.query('SELECT stock FROM products WHERE id = $1', [product_id]);
      if (pRows.length === 0 || pRows[0].stock < quantity) {
        return error(res, 'Not enough stock for this product', 400);
      }
    }

    // Upsert
    const { rows } = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, variant_id, quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id, variant_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING *`,
      [req.user.id, product_id, variant_id || null, quantity]
    );

    return success(res, rows[0], 'Item added to cart', 201);
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return error(res, 'Quantity must be at least 1', 400);
    }

    const { rows } = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, itemId, req.user.id]
    );

    if (rows.length === 0) return error(res, 'Cart item not found', 404);
    return success(res, rows[0], 'Cart item updated');
  } catch (err) {
    next(err);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    
    const { rowCount } = await pool.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [itemId, req.user.id]);
    
    if (rowCount === 0) return error(res, 'Cart item not found', 404);
    return success(res, null, 'Item removed from cart');
  } catch (err) {
    next(err);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    return success(res, null, 'Cart cleared successfully');
  } catch (err) {
    next(err);
  }
};
