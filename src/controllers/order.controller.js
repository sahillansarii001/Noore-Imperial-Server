import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { createRazorpayOrder } from '../services/payment.service.js';
import { generateInvoice as generateInvoiceUtil } from '../utils/generateInvoice.js';
import { getPagination, getPaginationMetadata } from '../utils/pagination.js';

export const createOrder = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { address_id, items, coupon_code, payment_method } = req.body;
    
    if (!items || items.length === 0) {
      throw new Error('Order items cannot be empty');
    }

    let subtotal = 0;
    const orderItemsData = [];

    // Process items and check stock
    for (const item of items) {
      const { product_id, variant_id, quantity } = item;
      let price = 0;
      
      if (variant_id) {
        const { rows } = await client.query('SELECT p.discount_price, p.price, pv.price_modifier, pv.stock FROM products p JOIN product_variants pv ON p.id = pv.product_id WHERE pv.id = $1', [variant_id]);
        if (rows.length === 0 || rows[0].stock < quantity) throw new Error(`Insufficient stock for variant ${variant_id}`);
        price = (rows[0].discount_price || rows[0].price) + (rows[0].price_modifier || 0);
      } else {
        const { rows } = await client.query('SELECT discount_price, price, stock FROM products WHERE id = $1', [product_id]);
        if (rows.length === 0 || rows[0].stock < quantity) throw new Error(`Insufficient stock for product ${product_id}`);
        price = rows[0].discount_price || rows[0].price;
      }
      
      subtotal += price * quantity;
      orderItemsData.push({ product_id, variant_id, quantity, price });
    }

    let discount = 0;
    // Coupon validation logic here (simplified)
    if (coupon_code) {
      const { rows } = await client.query('SELECT * FROM coupons WHERE code = $1 AND is_active = true', [coupon_code]);
      if (rows.length > 0) {
        const coupon = rows[0];
        if (subtotal >= coupon.min_order && (!coupon.expiry || new Date(coupon.expiry) > new Date()) && coupon.used_count < coupon.max_uses) {
          if (coupon.type === 'flat') {
            discount = coupon.discount_value;
          } else if (coupon.type === 'percent') {
            discount = Math.floor(subtotal * (coupon.discount_value / 100));
          }
        }
      }
    }

    // Taxes and Shipping
    const tax = Math.round((subtotal - discount) * 0.18); // 18% GST
    const shipping_fee = (subtotal - discount) > 100000 ? 0 : 5000; // Free shipping over ₹1000
    const total = subtotal - discount + tax + shipping_fee;

    // Create Razorpay Order
    let razorpay_order_id = null;
    if (payment_method === 'razorpay') {
      const rpOrder = await createRazorpayOrder(total, 'INR', `rcpt_${req.user.id.substring(0,8)}`);
      razorpay_order_id = rpOrder.id;
    }

    // Insert Order
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (user_id, address_id, status, subtotal, discount, tax, shipping_fee, total, payment_method, razorpay_order_id)
       VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, address_id, subtotal, discount, tax, shipping_fee, total, payment_method, razorpay_order_id]
    );

    const order = orderRows[0];

    // Insert Order Items
    for (const item of orderItemsData) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, variant_id, quantity, price) VALUES ($1, $2, $3, $4, $5)',
        [order.id, item.product_id, item.variant_id || null, item.quantity, item.price]
      );
    }

    // Optional: Clear items from cart if they match (simplified)
    
    await client.query('COMMIT');
    return success(res, order, 'Order created successfully', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    return error(res, err.message || 'Failed to create order', 400);
  } finally {
    client.release();
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status, date_from, date_to } = req.query;

    let query = 'SELECT * FROM orders';
    let countQuery = 'SELECT COUNT(*) FROM orders';
    const params = [];
    const countParams = [];
    let paramIndex = 1;
    const whereClauses = [];

    // Role based filtering
    if (req.user.role === 'customer') {
      whereClauses.push(`user_id = $${paramIndex}`);
      params.push(req.user.id);
      countParams.push(req.user.id);
      paramIndex++;
    }

    if (status) {
      whereClauses.push(`status = $${paramIndex}`);
      params.push(status);
      countParams.push(status);
      paramIndex++;
    }

    if (date_from) {
      whereClauses.push(`created_at >= $${paramIndex}`);
      params.push(date_from);
      countParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereClauses.push(`created_at <= $${paramIndex}`);
      params.push(date_to);
      countParams.push(date_to);
      paramIndex++;
    }

    if (whereClauses.length > 0) {
      const whereStr = ' WHERE ' + whereClauses.join(' AND ');
      query += whereStr;
      countQuery += whereStr;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const { rows: countRows } = await pool.query(countQuery, countParams);
    const { rows } = await pool.query(query, params);

    const pagination = getPaginationMetadata(countRows[0].count, page, limit);

    return success(res, rows, 'Orders retrieved successfully', 200, pagination);
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    let query = 'SELECT * FROM orders WHERE id = $1';
    const params = [id];
    
    if (req.user.role === 'customer') {
      query += ' AND user_id = $2';
      params.push(req.user.id);
    }
    
    const { rows: orderRows } = await pool.query(query, params);
    if (orderRows.length === 0) return error(res, 'Order not found or unauthorized', 404);
    
    const order = orderRows[0];
    
    const { rows: items } = await pool.query(
      `SELECT oi.*, p.name as product_name, pv.size, pv.color 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       LEFT JOIN product_variants pv ON oi.variant_id = pv.id 
       WHERE oi.order_id = $1`,
      [id]
    );
    
    order.items = items;
    
    return success(res, order, 'Order retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const { rows } = await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]);
    
    if (rows.length === 0) return error(res, 'Order not found', 404);
    // TODO: Send notification to user
    return success(res, rows[0], 'Order status updated');
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { rows: checkRows } = await pool.query('SELECT status FROM orders WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (checkRows.length === 0) return error(res, 'Order not found', 404);
    if (!['pending', 'confirmed'].includes(checkRows[0].status)) return error(res, 'Order cannot be cancelled at this stage', 400);
    
    const { rows } = await pool.query("UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *", [id]);
    
    // Restore stock logic would go here
    
    return success(res, rows[0], 'Order cancelled successfully');
  } catch (err) {
    next(err);
  }
};

export const returnOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { rows: checkRows } = await pool.query('SELECT status FROM orders WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (checkRows.length === 0) return error(res, 'Order not found', 404);
    if (checkRows[0].status !== 'delivered') return error(res, 'Only delivered orders can be returned', 400);
    
    await pool.query('UPDATE order_items SET returned = true WHERE order_id = $1', [id]);
    // Refund initiation logic goes here
    
    return success(res, null, 'Return initiated successfully');
  } catch (err) {
    next(err);
  }
};

export const getOrderInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { rows: orderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderRows.length === 0) return error(res, 'Order not found', 404);
    const order = orderRows[0];
    
    if (req.user.role === 'customer' && order.user_id !== req.user.id) {
      return error(res, 'Unauthorized', 403);
    }
    
    const { rows: userRows } = await pool.query('SELECT name, email, phone FROM users WHERE id = $1', [order.user_id]);
    const { rows: addressRows } = await pool.query('SELECT * FROM addresses WHERE id = $1', [order.address_id]);
    const { rows: items } = await pool.query(
      `SELECT oi.*, p.name as product_name, pv.size, pv.color 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       LEFT JOIN product_variants pv ON oi.variant_id = pv.id 
       WHERE oi.order_id = $1`,
      [id]
    );

    const invoice = generateInvoiceUtil(order, items, userRows[0], addressRows[0]);
    return success(res, invoice, 'Invoice generated successfully');
  } catch (err) {
    next(err);
  }
};
