import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';

export const getInventoryLogs = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT il.*, p.name as product_name, pv.size, pv.color 
       FROM inventory_logs il 
       JOIN products p ON il.product_id = p.id 
       LEFT JOIN product_variants pv ON il.variant_id = pv.id 
       ORDER BY il.created_at DESC`
    );
    return success(res, rows, 'Inventory logs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateInventory = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { product_id, variant_id, quantity_change, reason } = req.body;

    let newStock = 0;
    
    if (variant_id) {
      const { rows: vRows } = await client.query('SELECT stock FROM product_variants WHERE id = $1 AND product_id = $2', [variant_id, product_id]);
      if (vRows.length === 0) throw new Error('Variant not found');
      newStock = vRows[0].stock + quantity_change;
      if (newStock < 0) throw new Error('Insufficient stock for deduction');
      
      await client.query('UPDATE product_variants SET stock = $1 WHERE id = $2', [newStock, variant_id]);
    } else {
      const { rows: pRows } = await client.query('SELECT stock FROM products WHERE id = $1', [product_id]);
      if (pRows.length === 0) throw new Error('Product not found');
      newStock = pRows[0].stock + quantity_change;
      if (newStock < 0) throw new Error('Insufficient stock for deduction');
      
      await client.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, product_id]);
    }

    await client.query(
      `INSERT INTO inventory_logs (product_id, variant_id, quantity_change, reason)
       VALUES ($1, $2, $3, $4)`,
      [product_id, variant_id || null, quantity_change, reason || 'Manual adjustment']
    );

    await client.query('COMMIT');
    return success(res, { newStock }, 'Inventory updated successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    return error(res, err.message || 'Failed to update inventory', 400);
  } finally {
    client.release();
  }
};
