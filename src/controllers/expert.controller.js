import { pool } from '../config/db.js';
import { success, error } from '../utils/response.js';

export const getExperts = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, b.name as branch_name 
       FROM experts e 
       LEFT JOIN branches b ON e.branch_id = b.id 
       ORDER BY e.rating DESC`
    );
    return success(res, rows, 'Experts retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getExpertById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT e.*, b.name as branch_name 
       FROM experts e 
       LEFT JOIN branches b ON e.branch_id = b.id 
       WHERE e.id = $1`,
      [id]
    );
    if (rows.length === 0) return error(res, 'Expert not found', 404);
    return success(res, rows[0], 'Expert retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createExpert = async (req, res, next) => {
  try {
    const { user_id, name, speciality, bio, available_days, branch_id, avatar_url } = req.body;
    
    const { rows } = await pool.query(
      `INSERT INTO experts (user_id, name, speciality, bio, available_days, branch_id, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id, name, speciality, bio, available_days || [], branch_id || null, avatar_url]
    );
    
    return success(res, rows[0], 'Expert created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateExpert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, speciality, bio, available_days, branch_id, avatar_url } = req.body;
    
    const { rows } = await pool.query(
      `UPDATE experts 
       SET name = COALESCE($1, name), 
           speciality = COALESCE($2, speciality), 
           bio = COALESCE($3, bio), 
           available_days = COALESCE($4, available_days), 
           branch_id = COALESCE($5, branch_id), 
           avatar_url = COALESCE($6, avatar_url) 
       WHERE id = $7 RETURNING *`,
      [name, speciality, bio, available_days, branch_id, avatar_url, id]
    );
    
    if (rows.length === 0) return error(res, 'Expert not found', 404);
    return success(res, rows[0], 'Expert updated successfully');
  } catch (err) {
    next(err);
  }
};
