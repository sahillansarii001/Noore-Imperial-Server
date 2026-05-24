import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';
import { getPagination, getPaginationMetadata } from '../utils/pagination.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    
    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1', [req.user.id]);
    
    const { rows } = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );
    
    const pagination = getPaginationMetadata(countRows[0].count, page, limit);
    return success(res, rows, 'Notifications retrieved', 200, pagination);
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    
    if (rows.length === 0) return error(res, 'Notification not found', 404);
    return success(res, rows[0], 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false', [req.user.id]);
    return success(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

export const broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, role } = req.body; // if role provided, send to specific role, else all users
    
    let query = 'INSERT INTO notifications (user_id, title, message) SELECT id, $1, $2 FROM users';
    const params = [title, message];
    
    if (role) {
      query += ' WHERE role = $3';
      params.push(role);
    }
    
    await pool.query(query, params);
    return success(res, null, 'Broadcast sent successfully', 201);
  } catch (err) {
    next(err);
  }
};
