import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { createRazorpayOrder, verifySignature, createRefund } from '../services/payment.service.js';
import { env } from '../config/env.js';
import { sendWelcomeEmail } from '../services/email.service.js'; // generic email stand-in for order confirm

export const createOrderPayment = async (req, res, next) => {
  try {
    const { amount, receipt } = req.body;
    
    if (!amount) return error(res, 'Amount is required', 400);

    const order = await createRazorpayOrder(amount, 'INR', receipt || `rcpt_${req.user.id.substring(0,8)}`);
    
    return success(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: env.RAZORPAY.KEY_ID
    }, 'Razorpay order created');
  } catch (err) {
    next(err);
  }
};

export const verifyPayment = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) throw new Error('Invalid signature');

    // Update order status
    const { rows: orderRows } = await client.query(
      `UPDATE orders SET payment_status = 'paid', status = 'confirmed', updated_at = NOW() 
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [order_id, req.user.id]
    );

    if (orderRows.length === 0) throw new Error('Order not found');
    const order = orderRows[0];

    // Deduct stock
    const { rows: items } = await client.query('SELECT * FROM order_items WHERE order_id = $1', [order_id]);
    for (const item of items) {
      if (item.variant_id) {
        await client.query('UPDATE product_variants SET stock = GREATEST(stock - $1, 0) WHERE id = $2', [item.quantity, item.variant_id]);
      } else {
        await client.query('UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2', [item.quantity, item.product_id]);
      }
    }

    // Award loyalty points (1 per ₹100 => 1 per 10000 paise)
    const pointsToAward = Math.floor(order.total / 10000);
    if (pointsToAward > 0) {
      await client.query('UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2', [pointsToAward, req.user.id]);
      await client.query(
        `INSERT INTO loyalty_transactions (user_id, points, type, description) VALUES ($1, $2, 'earned', $3)`,
        [req.user.id, pointsToAward, `Earned from order ${order.id}`]
      );
    }

    // Send confirmation email
    const { rows: userRows } = await client.query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
    if (userRows.length > 0) {
      try {
        // Using welcome email logic as placeholder for order confirmation if separate not implemented
        await sendWelcomeEmail(userRows[0].email, userRows[0].name); 
      } catch (e) {
        console.error('Failed to send order email:', e);
      }
    }

    await client.query('COMMIT');
    return success(res, null, 'Payment verified successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    return error(res, err.message || 'Payment verification failed', 400);
  } finally {
    client.release();
  }
};

export const initiateRefund = async (req, res, next) => {
  try {
    const { paymentId, amount } = req.body;
    
    if (!paymentId) return error(res, 'Payment ID is required', 400);
    
    const refund = await createRefund(paymentId, amount); // amount in paise
    
    return success(res, refund, 'Refund initiated successfully');
  } catch (err) {
    next(err);
  }
};
