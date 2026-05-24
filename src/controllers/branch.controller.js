import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';

export const getBranches = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, u.name as manager_name 
       FROM branches b 
       LEFT JOIN users u ON b.manager_id = u.id 
       WHERE b.is_active = true 
       ORDER BY b.created_at DESC`
    );
    return success(res, rows, 'Branches retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getBranchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT b.*, u.name as manager_name 
       FROM branches b 
       LEFT JOIN users u ON b.manager_id = u.id 
       WHERE b.id = $1`,
      [id]
    );
    if (rows.length === 0) return error(res, 'Branch not found', 404);
    return success(res, rows[0], 'Branch retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createBranch = async (req, res, next) => {
  try {
    const { name, city, address, manager_id, phone } = req.body;
    
    const { rows } = await pool.query(
      `INSERT INTO branches (name, city, address, manager_id, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, city, address, manager_id || null, phone]
    );
    
    return success(res, rows[0], 'Branch created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, city, address, manager_id, phone, is_active } = req.body;
    
    const { rows } = await pool.query(
      `UPDATE branches 
       SET name = COALESCE($1, name), 
           city = COALESCE($2, city), 
           address = COALESCE($3, address), 
           manager_id = COALESCE($4, manager_id), 
           phone = COALESCE($5, phone),
           is_active = COALESCE($6, is_active)
       WHERE id = $7 RETURNING *`,
      [name, city, address, manager_id, phone, is_active, id]
    );
    
    if (rows.length === 0) return error(res, 'Branch not found', 404);
    return success(res, rows[0], 'Branch updated successfully');
  } catch (err) {
    next(err);
  }
};
