import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';

export const getMyCertificates = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, co.title as course_title 
       FROM certificates c 
       JOIN courses co ON c.course_id = co.id 
       WHERE c.student_id = $1 
       ORDER BY c.issued_at DESC`,
      [req.user.id]
    );
    
    return success(res, rows, 'Certificates retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const verifyCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(
      `SELECT c.*, u.name as student_name, co.title as course_title 
       FROM certificates c 
       JOIN users u ON c.student_id = u.id 
       JOIN courses co ON c.course_id = co.id 
       WHERE c.id = $1`,
      [id]
    );
    
    if (rows.length === 0) return error(res, 'Certificate not found', 404);
    
    return success(res, rows[0], 'Certificate verified successfully');
  } catch (err) {
    next(err);
  }
};
