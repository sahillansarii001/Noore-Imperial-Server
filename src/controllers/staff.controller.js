import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';
import bcrypt from 'bcrypt';

export const getStaff = async (req, res, next) => {
  try {
    const { branch_id, role } = req.query;
    
    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_verified, 
             s.branch_id, b.name as branch_name 
      FROM users u 
      LEFT JOIN staff_details s ON u.id = s.user_id 
      LEFT JOIN branches b ON s.branch_id = b.id 
      WHERE u.role IN ('admin', 'branch_manager', 'stylist', 'inventory_manager')
    `;
    const params = [];
    let paramIndex = 1;

    if (branch_id) {
      query += ` AND s.branch_id = $${paramIndex}`;
      params.push(branch_id);
      paramIndex++;
    }

    if (role) {
      query += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    query += ' ORDER BY u.created_at DESC';

    const { rows } = await pool.query(query, params);
    return success(res, rows, 'Staff retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createStaff = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, email, phone, password, role, branch_id } = req.body;
    
    // Check user
    const { rows: existingUser } = await client.query('SELECT id FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (existingUser.length > 0) throw new Error('User with email or phone already exists');
    
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const { rows: userRows } = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role, is_verified) 
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id, name, email, role`,
      [name, email, phone, passwordHash, role]
    );
    
    const user = userRows[0];
    
    // Add staff details
    if (branch_id) {
      await client.query(
        'INSERT INTO staff_details (user_id, branch_id) VALUES ($1, $2)',
        [user.id, branch_id]
      );
    }
    
    await client.query('COMMIT');
    return success(res, user, 'Staff created successfully', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    return error(res, err.message || 'Failed to create staff', 400);
  } finally {
    client.release();
  }
};

export const getStaffPerformance = async (req, res, next) => {
  try {
    const { id } = req.params; // user_id of stylist
    
    // Simple example: count completed consultations
    const { rows } = await pool.query(
      `SELECT COUNT(*) as total_consultations 
       FROM consultations 
       WHERE expert_id = (SELECT id FROM experts WHERE user_id = $1) AND status = 'completed'`,
      [id]
    );
    
    return success(res, { completed_consultations: parseInt(rows[0].total_consultations) }, 'Staff performance retrieved');
  } catch (err) {
    next(err);
  }
};
