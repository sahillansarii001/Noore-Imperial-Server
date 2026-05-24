import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { createShipment, trackShipment } from '../services/shipping.service.js';

export const createOrderShipment = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { orderId } = req.body; // Actually route is /create, orderId in body
    
    const { rows: orderRows } = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (orderRows.length === 0) throw new Error('Order not found');
    
    const order = orderRows[0];
    if (order.status === 'shipped' || order.status === 'delivered') {
      throw new Error('Order already shipped or delivered');
    }

    const shipmentData = await createShipment({
      order_id: order.id,
      // Pass other necessary data from order for Shiprocket
    });

    const { rows } = await client.query(
      `UPDATE orders 
       SET status = 'shipped', tracking_id = $1, courier_name = $2, updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [shipmentData.awb_code, shipmentData.courier_name, order.id]
    );

    await client.query('COMMIT');
    return success(res, rows[0], 'Shipment created successfully', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    return error(res, err.message || 'Failed to create shipment', 400);
  } finally {
    client.release();
  }
};

export const trackOrderShipment = async (req, res, next) => {
  try {
    const { awb } = req.params;
    
    const trackingInfo = await trackShipment(awb);
    
    return success(res, trackingInfo, 'Tracking info retrieved');
  } catch (err) {
    next(err);
  }
};
