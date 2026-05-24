import { pool } from '../config/db.js';

export const getRevenueByPeriod = async (period) => {
  let dateTrunc = 'day';
  if (period === 'weekly') dateTrunc = 'week';
  if (period === 'monthly') dateTrunc = 'month';
  if (period === 'yearly') dateTrunc = 'year';
  
  const { rows } = await pool.query(
    `SELECT DATE_TRUNC($1, created_at) as period, SUM(total) as revenue 
     FROM orders 
     WHERE payment_status = 'paid' 
     GROUP BY DATE_TRUNC($1, created_at) 
     ORDER BY period ASC`,
    [dateTrunc]
  );
  return rows;
};

export const getBestSellingProducts = async (limit = 10) => {
  const { rows } = await pool.query(
    `SELECT p.id as product_id, p.name, SUM(oi.quantity) as total_sold, SUM(oi.price * oi.quantity) as revenue
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     JOIN orders o ON oi.order_id = o.id
     WHERE o.payment_status = 'paid'
     GROUP BY p.id, p.name
     ORDER BY total_sold DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
};

export const getCustomerStats = async () => {
  const { rows: totalRows } = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = $1', ['customer']);
  
  const { rows: newRows } = await pool.query(
    `SELECT COUNT(*) as new_this_month 
     FROM users 
     WHERE role = $1 AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
    ['customer']
  );
  
  const { rows: returningRows } = await pool.query(
    `SELECT COUNT(*) as returning 
     FROM (
       SELECT user_id, COUNT(*) as order_count 
       FROM orders 
       GROUP BY user_id 
       HAVING COUNT(*) >= 2
     ) as returning_customers`
  );
  
  return {
    total: parseInt(totalRows[0].total),
    new_this_month: parseInt(newRows[0].new_this_month),
    returning: parseInt(returningRows[0].returning)
  };
};

export const getBranchRevenue = async () => {
  const { rows } = await pool.query(
    `SELECT b.id as branch_id, b.name, COUNT(c.id) as consultation_count, COALESCE(SUM(c.budget), 0) as revenue
     FROM branches b
     LEFT JOIN consultations c ON b.id = c.branch_id AND c.status = 'completed'
     GROUP BY b.id, b.name
     ORDER BY revenue DESC`
  );
  return rows;
};

export const getAcademyStats = async () => {
  const { rows } = await pool.query(
    `SELECT c.id as course_id, c.title, COUNT(e.id) as enrollment_count, 
            SUM(CASE WHEN e.progress = 100 THEN 1 ELSE 0 END) as completion_count,
            COUNT(e.id) * c.price as revenue
     FROM courses c
     LEFT JOIN enrollments e ON c.id = e.course_id
     GROUP BY c.id, c.title, c.price
     ORDER BY enrollment_count DESC`
  );
  return rows;
};

export const getOrderStats = async () => {
  const { rows } = await pool.query(
    `SELECT 
       COUNT(*) as total_orders,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
       SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
       SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
       SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
       COALESCE(AVG(total), 0) as avg_order_value
     FROM orders`
  );
  
  const stats = rows[0];
  for (let key in stats) {
    stats[key] = Math.round(parseFloat(stats[key]));
  }
  return stats;
};
